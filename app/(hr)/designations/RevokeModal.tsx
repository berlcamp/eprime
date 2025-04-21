import {
  CustomButton,
  OneColLayoutLoading,
  UserBlock
} from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  fetchDistricts,
  fetchOffices,
  fetchPositions,
  fetchSchools,
  handleConvertEmployeeToNonTeaching,
  logError
} from '@/utils/fetchApi'
import { generateReferenceCode } from '@/utils/text-helper'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type {
  DistrictTypes,
  LeaveCreditTypes,
  Office,
  PositionTypes,
  RevokeTypes,
  SchoolTypes
} from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: RevokeTypes | null
}

const RevokeModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()
  const [saving, setSaving] = useState(false)

  const isTeaching = editData?.hrm_users.position_type === 'Teaching'
  const [vlslBalance, setVlslBalance] = useState(0)
  const [scBalance, setScBalance] = useState(0)

  const [action, setAction] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hasError, setHasError] = useState(false)

  const [loadingSchools, setLoadingSchools] = useState(false)
  const [assignment, setAssignment] = useState('')
  const [type, setType] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [districts, setDistricts] = useState<DistrictTypes[] | []>([])
  const [offices, setOffices] = useState<Office[] | []>([])
  const [positions, setPositions] = useState<PositionTypes[] | []>([])

  const [isServiceRecordChecked, setIsServiceRecordChecked] = useState(false)
  const [isLeaveCardChecked, setIsLeaveCardChecked] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<RevokeTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: RevokeTypes) => {
    if (action === '' || endDate === '') {
      setHasError(true)
      return
    }

    setHasError(false)

    if (saving) return

    setSaving(true)

    void handleRevoke()

    if (action === 'Reassign') {
      void handleCreateAssignment(formdata)
    }
    if (action === 'Redesignate') {
      void handleCreateDesignation(formdata)
    }
  }

  const handleRevoke = async () => {
    if (!editData) return

    const newData = {
      to: new Date(endDate), // use the string data before storing the redux to avoid error
      status: 'Revoked'
    }

    try {
      const { error } = await supabase
        .from('hrm_designations')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)

      const { error: error2 } = await supabase
        .from('hrm_service_records')
        .update({ to: endDate })
        .eq('designation_id', editData.id)

      if (error2) throw new Error(error2.message)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateDesignation = async (formdata: RevokeTypes) => {
    if (!editData) return

    let district =
      formdata.area_assigned === 'school' ? Number(formdata.district_id) : null
    let school =
      formdata.area_assigned === 'school' ? Number(formdata.school_id) : null
    let office =
      formdata.area_assigned === 'office' ? Number(formdata.office_id) : null

    // set these to null to prevent error
    if (formdata.type === 'Function only') {
      district = null
      school = null
      office = null
    }

    const newData = {
      reference_code: generateReferenceCode(),
      hrm_user_id: editData.hrm_user_id,
      area_assigned: formdata.area_assigned || null,
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      type: formdata.type,
      add_to_service_record: isServiceRecordChecked,
      add_to_leave_card: isLeaveCardChecked,
      district_id: district,
      school_id: school,
      office_id: office,
      designation: formdata.designation,
      status: 'Active',
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_designations')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create designation',
          'hrm_designations',
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

      // convert employee to non-teaching and service credits to vl/sl
      if (isTeaching && isLeaveCardChecked) {
        void handleConvertEmployeeToNonTeaching(
          editData.hrm_user_id,
          formdata.date_of_next_increment
        )
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { status: 'Revoked', to: endDate, id: editData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }

      const updatedDropdownData = getUpdatedDropdownData(formdata)
      const newDataArray = {
        ...newData,
        from: formdata.from,
        hrm_users: editData.hrm_users,
        ...updatedDropdownData,
        id: newId
      }
      dispatch(updateList([newDataArray, ...items]))

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

  const handleCreateAssignment = async (formdata: RevokeTypes) => {
    if (!editData) return

    const district =
      formdata.area_assigned === 'school' ? Number(formdata.district_id) : null
    const school =
      formdata.area_assigned === 'school' ? Number(formdata.school_id) : null
    const office =
      formdata.area_assigned === 'office' ? Number(formdata.office_id) : null
    const position = Number(formdata.position_id)

    const newData = {
      reference_code: generateReferenceCode(),
      hrm_user_id: editData.hrm_user_id,
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
          'Create New re-Assignment',
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

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Update data in redux
      const items = [...globallist]
      const updatedData = { status: 'Revoked', to: endDate, id: editData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

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

  const handleAddToServiceRecord = async (
    formdata: RevokeTypes,
    newId: string
  ) => {
    if (!editData) return

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
      user_id: editData?.hrm_user_id,
      assignment_id: action === 'Reassign' ? newId : null,
      designation_id: action === 'Redesignate' ? newId : null,
      org_id: process.env.NEXT_PUBLIC_ORG_ID,
      from: formdata.from,
      designation: formdata.designation,
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
          'Create service record from designations',
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

  const getUpdatedDropdownData = (formdata: RevokeTypes) => {
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

    return json
  }

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrict(districtId)
    setLoadingSchools(true)

    const result = await fetchSchools({ filterDistrictId: districtId }, 300, 0)

    setSchools(result.data.length > 0 ? result.data : [])
    setLoadingSchools(false)
  }

  useEffect(() => {
    void (async () => {
      if (!editData) return

      // Count Service Credits balance if teaching
      if (editData?.hrm_users.position_type === 'Teaching') {
        // Current Balances
        const { data: balancesData } = await supabase
          .from('hrm_leave_credits')
          .select()
          .eq('user_id', editData.hrm_users.id)

        const balances: Array<{
          type: string
          balance: string
        }> = []

        if (balancesData && balancesData.length > 0) {
          const creditsData: LeaveCreditTypes[] = balancesData
          creditsData.forEach((credit) => {
            balances.push({
              type: credit.type,
              balance: credit.credits.toString()
            })
          })
        }
        // Count Service Credits balance if teaching
        const sc =
          balances.find((item) => item.type === 'Service Credit')?.balance ?? 0
        setScBalance(Number(sc))

        // formula to convert sc to vl/sl as amended by CSC MC No.41, s. 1998
        const vlsl = (30 * Number(sc)) / 69
        setVlslBalance(vlsl)
      }
    })()
  }, [])

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
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
              <h5 className="app__modal_header_text">Revoke Designation</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              {editData && (
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Employee Name:</div>
                    <div className="app__label_value">
                      <UserBlock user={editData.hrm_users} />
                    </div>
                  </div>
                </div>
              )}
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">End Date</div>
                  <div>
                    <input
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      type="date"
                      className="app__select_standard"
                    />
                    {endDate === '' && hasError && (
                      <div className="app__error_message">
                        End Date is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Action</div>
                  <div>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="app__select_standard"
                    >
                      <option value="">Choose</option>
                      <option value="Reassign">Reassign</option>
                      <option value="Redesignate">Redesignate</option>
                    </select>
                    {action === '' && hasError && (
                      <div className="app__error_message">
                        Action is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {action === 'Redesignate' && (
                <>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Designation</div>
                      <div>
                        <input
                          {...register('designation', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.designation && (
                          <div className="app__error_message">
                            Designation is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Type</div>
                      <div>
                        <select
                          {...register('type', { required: true })}
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="app__select_standard"
                        >
                          <option value="">Choose</option>
                          <option value="Function only">Function only</option>
                          <option value="Function with Station">
                            Function with Station
                          </option>
                        </select>
                        {errors.type && (
                          <div className="app__error_message">
                            Type is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {type === 'Function with Station' && (
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
                  )}
                  {assignment === 'school' &&
                    type === 'Function with Station' && (
                      <>
                        <div className="app__form_field_container">
                          <div className="w-full">
                            <div className="app__label_standard">
                              Choose district
                            </div>
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
                  {assignment === 'school' &&
                    type === 'Function with Station' &&
                    !loadingSchools && (
                      <>
                        <div className="app__form_field_container">
                          <div className="w-full">
                            <div className="app__label_standard">
                              Choose School
                            </div>
                            <div>
                              <select
                                {...register('school_id', { required: true })}
                                value={selectedSchool}
                                onChange={(e) =>
                                  setSelectedSchool(e.target.value)
                                }
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
                  {assignment === 'office' &&
                    type === 'Function with Station' && (
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Choose office
                          </div>
                          <div>
                            <select
                              {...register('office_id', { required: true })}
                              value={selectedOffice}
                              onChange={(e) =>
                                setSelectedOffice(e.target.value)
                              }
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
                  {isTeaching && (
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">
                          <label className="flex items-center space-x-1">
                            <input
                              onChange={() =>
                                setIsLeaveCardChecked(!isLeaveCardChecked)
                              }
                              checked={isLeaveCardChecked}
                              type="checkbox"
                              className=""
                            />
                            <span>
                              Convert employee&apos;s Service Credits to SL/VL
                            </span>
                          </label>
                        </div>
                        {isLeaveCardChecked && (
                          <>
                            <div className="ml-4 mb-4 text-xs text-gray-700">
                              <span className="text-green-700 font-bold">
                                {Number(scBalance).toFixed(3)}
                              </span>{' '}
                              Service Credits will be converted to{' '}
                              <span className="text-green-700 font-bold">
                                {(vlslBalance / 2).toFixed(3)}
                              </span>{' '}
                              VL and{' '}
                              <span className="text-green-700 font-bold">
                                {(vlslBalance / 2).toFixed(3)}
                              </span>{' '}
                              SL
                            </div>
                            <div className="app__form_field_container">
                              <div className="w-full">
                                <div className="app__label_standard">
                                  Specify date of next VL/SL Increment:
                                </div>
                                <div>
                                  <input
                                    {...register('date_of_next_increment', {
                                      required: true
                                    })}
                                    type="date"
                                    className="app__input_standard"
                                  />
                                  {errors.date_of_next_increment && (
                                    <div className="app__error_message">
                                      Specify date of next VL/SL increment
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {action === 'Reassign' && (
                <>
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
                          <div className="app__label_standard">
                            Choose district
                          </div>
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
                          <div className="app__label_standard">
                            Choose School
                          </div>
                          <div>
                            <select
                              {...register('school_id', { required: true })}
                              value={selectedSchool}
                              onChange={(e) =>
                                setSelectedSchool(e.target.value)
                              }
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
                </>
              )}
              {action !== '' && (
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      <label className="flex items-center space-x-1">
                        <input
                          onChange={() =>
                            setIsServiceRecordChecked(!isServiceRecordChecked)
                          }
                          checked={isServiceRecordChecked}
                          type="checkbox"
                          className=""
                        />
                        <span>
                          Include this to Employee&apos;s Service Record
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
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
              <hr className="my-6" />
              <div className="app__form_field_container">
                <div className="app__label_standard">
                  <label className="flex items-center space-x-1">
                    <input
                      {...register('confirmed', { required: true })}
                      type="checkbox"
                      className=""
                    />
                    <span className="font-normal text-xs">
                      By checking this box, you acknowledge that all information
                      is accurate and up-to-date.
                    </span>
                  </label>
                  {errors.confirmed && (
                    <div className="app__error_message">
                      Confirmation is required
                    </div>
                  )}
                </div>
              </div>
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

export default RevokeModal
