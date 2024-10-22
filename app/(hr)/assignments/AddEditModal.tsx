import {
  CustomButton,
  OneColLayoutLoading,
  SearchUserInput,
  UserBlock
} from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  fetchDistricts,
  fetchOffices,
  fetchPositions,
  fetchSchools,
  logError
} from '@/utils/fetchApi'
import { generateReferenceCode } from '@/utils/text-helper'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type {
  AssignmentTypes,
  DistrictTypes,
  Employee,
  Office,
  PositionTypes,
  SchoolTypes
} from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { XCircleIcon } from '@heroicons/react/24/solid'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: AssignmentTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [user, setUser] = useState<Employee | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | ''>('')
  const [dataValidationErrors, setDataValidationErrors] = useState<
    string[] | []
  >([])

  const [loadingSchools, setLoadingSchools] = useState(false)
  const [assignment, setAssignment] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [districts, setDistricts] = useState<DistrictTypes[] | []>([])
  const [offices, setOffices] = useState<Office[] | []>([])
  const [positions, setPositions] = useState<PositionTypes[] | []>([])

  const [isServiceRecordChecked, setIsServiceRecordChecked] = useState(true)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<AssignmentTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: AssignmentTypes) => {
    if (saving) return

    setSaving(true)

    if (!editData && !user) {
      setErrorMessage('Employee Name is Required')
      return
    }

    const hasErrors: boolean = await validateEmployee(formdata)

    if (!hasErrors) {
      if (editData) {
        void handleUpdate(formdata)
      } else {
        void handleCreate(formdata)
      }
    }
  }

  const handleCreate = async (formdata: AssignmentTypes) => {
    if (!user) return

    const district =
      formdata.area_assigned === 'school' ? Number(formdata.district_id) : null
    const school =
      formdata.area_assigned === 'school' ? Number(formdata.school_id) : null
    const office =
      formdata.area_assigned === 'office' ? Number(formdata.office_id) : null
    const position = Number(formdata.position_id)

    const newData = {
      reference_code: generateReferenceCode(),
      hrm_user_id: user.id,
      area_assigned: formdata.area_assigned,
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      type: formdata.type,
      add_to_service_record: isServiceRecordChecked,
      district_id: district,
      school_id: school,
      office_id: office,
      position_id: position,
      status: 'Active',
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_assignments')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Assignment',
          'hrm_assignments',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      newId = data[0].id // newly created ID use this on 'finally' block

      // add to service record
      if (isServiceRecordChecked) {
        void handleAddToServiceRecord(formdata, newId)
      }

      // Append new data in redux
      const updatedDropdownData = getUpdatedDropdownData(formdata)
      const updatedData = {
        ...newData,
        from: formdata.from,
        hrm_users: user,
        ...updatedDropdownData,
        id: newId
      }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1
        })
      )

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: AssignmentTypes) => {
    if (!editData) return

    const district =
      formdata.area_assigned === 'school' ? Number(formdata.district_id) : null
    const school =
      formdata.area_assigned === 'school' ? Number(formdata.school_id) : null
    const office =
      formdata.area_assigned === 'office' ? Number(formdata.office_id) : null
    const position = Number(formdata.position_id)

    const newData = {
      area_assigned: formdata.area_assigned,
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      type: formdata.type,
      add_to_service_record: isServiceRecordChecked,
      district_id: district,
      school_id: school,
      office_id: office,
      position_id: position
    }

    try {
      const { error } = await supabase
        .from('hrm_assignments')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update Assignment',
          'hrm_assignments',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedDropdownData = getUpdatedDropdownData(formdata)
      const updatedData = {
        ...newData,
        from: formdata.from,
        id: editData.id,
        ...updatedDropdownData
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    }
  }

  const handleAddToServiceRecord = async (
    formdata: AssignmentTypes,
    newId: string
  ) => {
    if (!user) return

    const hrmPosition = positions.find(
      (p) => p.id.toString() === formdata.position_id?.toString()
    )

    let station = ''
    if (formdata.area_assigned === 'school') {
      const hrmSchool = schools.find(
        (p) => p.id.toString() === formdata.school_id?.toString()
      )
      station = hrmSchool ? hrmSchool.name : ''
    } else {
      const hrmOffice = offices.find(
        (p) => p.id.toString() === formdata.office_id?.toString()
      )
      station = hrmOffice ? hrmOffice.name : ''
    }

    const newData = {
      user_id: user.id,
      assignment_id: newId,
      org_id: process.env.NEXT_PUBLIC_ORG_ID,
      from: formdata.from,
      designation: hrmPosition?.name,
      status: formdata.service_record_status,
      salary: '',
      station,
      branch: 'National',
      separation_date: '',
      separation_cause: '',
      remarks: '',
      created_by: session.user.id
    }

    try {
      const { error } = await supabase
        .from('hrm_service_records')
        .insert(newData)

      if (error) {
        void logError(
          'Create service record from assignments',
          'hrm_service_records',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getUpdatedDropdownData = (formdata: AssignmentTypes) => {
    let json = {}
    if (formdata.area_assigned === 'school') {
      // Districts
      const dis = districts.filter(
        (x) => x.id.toString() === formdata.district_id
      )
      if (dis.length > 0) {
        json = { ...json, hrm_districts: { id: dis[0].id, name: dis[0].name } }
      }

      // Schools
      const sch = schools.filter((x) => x.id.toString() === formdata.school_id)
      if (sch.length > 0) {
        json = { ...json, hrm_schools: { id: sch[0].id, name: sch[0].name } }
      }
    } else {
      // offices
      const off = offices?.filter((x) => x.id.toString() === formdata.office_id)
      if (off.length > 0) {
        json = { ...json, hrm_offices: { id: off[0].id, name: off[0].name } }
      }
    }

    // positions
    const pos = positions?.filter(
      (x) => x.id.toString() === formdata.position_id
    )
    if (pos.length > 0) {
      json = { ...json, hrm_positions: { id: pos[0].id, name: pos[0].name } }
    }

    return json
  }

  const validateEmployee = async (formdata: AssignmentTypes) => {
    let query = supabase
      .from('hrm_assignments')
      .select(
        '*, hrm_users:hrm_user_id(firstname,middlename,lastname),hrm_schools:school_id(name),hrm_offices:office_id(name)'
      )

    if (editData) {
      query = query.neq('id', editData.id)
      query = query.eq('hrm_user_id', editData.hrm_user_id)
    } else {
      query = query.eq('hrm_user_id', user?.id)
    }

    const { data, error }: { data: AssignmentTypes[]; error: any } = await query

    if (error) console.error(error)

    if (data.length === 0) return false

    const validationErrors: string[] = []

    data.forEach((item) => {
      let station = ''
      if (item.area_assigned === 'school') {
        station = item.hrm_schools?.name
      } else {
        station = item.hrm_offices?.name
      }

      if (
        item.type === 'Re-assignment' &&
        formdata.type === 'Re-assignment' &&
        item.status === 'Active'
      ) {
        // check if the employee has an active re-assignment
        validationErrors.push(
          `This employee currently have an active re-assignment (Ref Code: ${item.reference_code}) stationed at ${station}. You must first fill up the "End Date" of that active record.`
        )
      } else if (
        item.type === 'New Employee' &&
        formdata.type === 'New Employee' &&
        item.status === 'Active'
      ) {
        // check if new employee already exists
        validationErrors.push(
          `This employee currently have an active Assignment (Ref Code: ${item.reference_code}).`
        )
      }
    })

    if (validationErrors.length === 0) {
      return false
    } else {
      setSaving(false)
      setDataValidationErrors(validationErrors)
      return true
    }
  }

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
    } else {
      setUser(null)
    }
  }

  const handleServiceRecordCheckboxChange = () => {
    setIsServiceRecordChecked(!isServiceRecordChecked)
  }

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrict(districtId)
    setLoadingSchools(true)

    const result = await fetchSchools({ filterDistrictId: districtId }, 300, 0)

    setSchools(result.data.length > 0 ? result.data : [])
    setLoadingSchools(false)
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    // display the default values of dynamic dropdowns
    if (editData) {
      setAssignment(editData.area_assigned)
      setIsServiceRecordChecked(editData.add_to_service_record)
      setSelectedDistrict(editData.district_id ?? '')
      setSelectedSchool(editData.school_id ?? '')
      setSelectedOffice(editData.office_id ?? '')
      setSelectedPosition(editData.position_id ?? '')

      // Update school list dropdown
      if (editData.area_assigned === 'school')
        void handleDistrictChange(editData.district_id)
    }

    reset({
      area_assigned: editData ? editData.area_assigned : '',
      district_id: editData ? editData.district_id : '',
      school_id: editData ? editData.school_id : '',
      office_id: editData ? editData.office_id : '',
      position_id: editData ? editData.position_id : '',
      from: editData ? editData.from : '',
      to: editData ? editData.to : '',
      type: editData ? editData.type : ''
    })

    const fetchDistrictsData = async () => {
      const result = await fetchDistricts('', 300, 0)
      setDistricts(result.data.length > 0 ? result.data : [])
    }

    const fetchOfficesData = async () => {
      const result = await fetchOffices('', 300, 0)
      setOffices(result.data.length > 0 ? result.data : [])
    }

    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 300, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }

    void fetchPositionsData()
    void fetchDistrictsData()
    void fetchOfficesData()
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Assignment Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="app__form_field_container">
                <div className="w-full">
                  {(dataValidationErrors.length > 0 || errorMessage) && (
                    <div className="mb-6">
                      <div className="font-semebold text-sm font-bold">
                        Please check the following errors below:
                      </div>
                      {dataValidationErrors.map((error, index) => (
                        <div
                          key={index}
                          className="text-xs text-red-500 mt-2 flex space-x-2"
                        >
                          <XCircleIcon className="w-5 h-5" />{' '}
                          <span>{error}</span>
                        </div>
                      ))}
                      {errorMessage && (
                        <div className="text-xs text-red-500 mt-2 flex space-x-2">
                          <XCircleIcon className="w-5 h-5" />{' '}
                          <span>{errorMessage}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="app__label_standard">Employee Name:</div>
                  {editData ? (
                    <div className="app__label_value">
                      <UserBlock user={editData.hrm_users} />
                    </div>
                  ) : (
                    <SearchUserInput
                      isMultiple={false}
                      handleSelectedUsers={handleSelectedUsers}
                    />
                  )}
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Type</div>
                  <div>
                    <select
                      {...register('type', { required: true })}
                      className="app__select_standard"
                    >
                      <option value="">Choose</option>
                      <option value="New Employee">New Employee</option>
                      <option value="Re-assignment">Re-assignment</option>
                    </select>
                    {errors.type && (
                      <div className="app__error_message">Type is required</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Position</div>
                  <div>
                    <select
                      {...register('position_id', { required: true })}
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="app__input_standard"
                    >
                      <option value="">Choose Position</option>
                      {positions.map((position: PositionTypes, index) => (
                        <option key={index} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </select>
                    {errors.position_id && (
                      <div className="app__error_message">
                        Position is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Station</div>
                  <div>
                    <select
                      {...register('area_assigned', { required: true })}
                      value={assignment}
                      onChange={(e) => setAssignment(e.target.value)}
                      className="app__select_standard"
                    >
                      <option value="">Choose</option>
                      <option value="school">School</option>
                      <option value="office">Division Office</option>
                    </select>
                    {errors.area_assigned && (
                      <div className="app__error_message">
                        Station is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {assignment === 'school' && (
                <>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Choose district</div>
                      <div>
                        <select
                          {...register('district_id', { required: true })}
                          onChange={async (e) =>
                            await handleDistrictChange(e.target.value)
                          }
                          value={selectedDistrict}
                          className="app__select_standard"
                        >
                          <option value="">Choose</option>
                          {districts.map((item, index) => (
                            <option key={index} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        {errors.district_id && (
                          <div className="app__error_message">
                            District is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {loadingSchools && (
                <div className="">
                  <OneColLayoutLoading rows={1} />
                </div>
              )}
              {assignment === 'school' && !loadingSchools && (
                <>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Choose School</div>
                      <div>
                        <select
                          {...register('school_id', { required: true })}
                          value={selectedSchool}
                          onChange={(e) => setSelectedSchool(e.target.value)}
                          className="app__select_standard"
                        >
                          <option value="">Choose</option>
                          {schools.map((item, index) => (
                            <option key={index} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        {errors.school_id && (
                          <div className="app__error_message">
                            School is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {assignment === 'office' && (
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Choose office</div>
                    <div>
                      <select
                        {...register('office_id', { required: true })}
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        {offices.map((item, index) => (
                          <option key={index} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      {errors.office_id && (
                        <div className="app__error_message">
                          Office is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Start Date</div>
                  <div>
                    <input
                      {...register('from', { required: true })}
                      type="date"
                      className="app__select_standard"
                    />
                    {errors.from && (
                      <div className="app__error_message">
                        Start Date is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    <label className="flex items-center space-x-1">
                      <input
                        onChange={handleServiceRecordCheckboxChange}
                        checked={isServiceRecordChecked}
                        type="checkbox"
                        className=""
                      />
                      <span>
                        Include this to Employees&apos;s Service Record
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              {isServiceRecordChecked && (
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Status</div>
                    <div>
                      <select
                        {...register('service_record_status', {
                          required: true
                        })}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="Casual">Casual</option>
                        <option value="Contractual">Contractual</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Provisionary">Provisionary</option>
                        <option value="Provisional">Provisional</option>
                        <option value="Permanent">Permanent</option>
                        <option value="School Board">School Board</option>
                        <option value="Substitute">Substitute</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                      {errors.service_record_status && (
                        <div className="app__error_message">
                          Status is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? 'Saving...' : 'Save'}
                  containerStyles="app__btn_green"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEditModal
