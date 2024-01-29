import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchDistricts, fetchLeaveCards, fetchOffices, fetchSchools, handleConvertEmployeeToNonTeaching, logError } from '@/utils/fetchApi'
import { CustomButton, OneColLayoutLoading, SearchUserInput, UserBlock } from '@/components'
import { generateReferenceCode } from '@/utils/text-helper'

// Types
import type { DesignationTypes, DistrictTypes, Office, SchoolTypes, namesType } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { XCircleIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'

interface ModalProps {
  hideModal: () => void
  editData: DesignationTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [isTeaching, setIsTeaching] = useState(false)
  const [vlslBalance, setVlslBalance] = useState(0)
  const [scBalance, setScBalance] = useState(0)

  // Search employee
  const [user, setUser] = useState<namesType | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | ''>('')
  const [dataValidationErrors, setDataValidationErrors] = useState<string[] | []>([])

  const [loadingSchools, setLoadingSchools] = useState(false)
  const [assignment, setAssignment] = useState('')
  const [type, setType] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [districts, setDistricts] = useState<DistrictTypes[] | []>([])
  const [offices, setOffices] = useState<Office[] | []>([])

  const [isServiceRecordChecked, setIsServiceRecordChecked] = useState(false)
  const [isLeaveCardChecked, setIsLeaveCardChecked] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<DesignationTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: DesignationTypes) => {
    if (!editData && !user) {
      setErrorMessage('Employee Name is Required')
      return
    }

    if (saving) return

    setSaving(true)

    const hasErrors: boolean = await validateEmployee(formdata)

    if (!hasErrors) {
      if (editData) {
        void handleUpdate(formdata)
      } else {
        void handleCreate(formdata)
      }
    }
  }

  const handleCreate = async (formdata: DesignationTypes) => {
    if (!user) return

    let district = formdata.area_assigned === 'school' ? Number(formdata.district_id) : null
    let school = formdata.area_assigned === 'school' ? Number(formdata.school_id) : null
    let office = formdata.area_assigned === 'office' ? Number(formdata.office_id) : null

    // set these to null to prevent error
    if (formdata.type === 'Function only') {
      district = null
      school = null
      office = null
    }

    const newData = {
      reference_code: generateReferenceCode(),
      hrm_user_id: user.id,
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
        void logError('Create designation', 'hrm_designations', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      newId = data[0].id // newly created ID use this on 'finally' block

      // add to service record
      if (isServiceRecordChecked) {
        void handleAddToServiceRecord(formdata, newId)
      }

      // update position type of employee to Non-teaching only if checkbox is checked and convert employee to non-teaching and service credits to vl/sl
      if (isTeaching && isLeaveCardChecked) {
        void handleConvertEmployeeToNonTeaching(user.id)
      }

      // Append new data in redux
      const updatedDropdownData = getUpdatedDropdownData(formdata)
      const updatedData = { ...newData, from: formdata.from, hrm_users: user, ...updatedDropdownData, id: newId }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(updateResultCounter({ showing: Number(resultsCounter.showing) + 1, results: Number(resultsCounter.results) + 1 }))

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: DesignationTypes) => {
    if (!editData) return

    let district = formdata.area_assigned === 'school' ? Number(formdata.district_id) : null
    let school = formdata.area_assigned === 'school' ? Number(formdata.school_id) : null
    let office = formdata.area_assigned === 'office' ? Number(formdata.office_id) : null
    let areaAssigned: string | null = formdata.area_assigned

    // set these to null to prevent error
    if (formdata.type === 'Function only') {
      district = null
      school = null
      office = null
      areaAssigned = null
    }

    const newData = {
      area_assigned: areaAssigned,
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      type: formdata.type,
      add_to_service_record: isServiceRecordChecked,
      add_to_leave_card: isLeaveCardChecked,
      district_id: district,
      school_id: school,
      office_id: office,
      designation: formdata.designation
    }

    try {
      const { error } = await supabase
        .from('hrm_designations')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError('Update designation', 'hrm_designations', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedDropdownData = getUpdatedDropdownData(formdata)
      const updatedData = { ...newData, from: formdata.from, id: editData.id, ...updatedDropdownData }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddToServiceRecord = async (formdata: DesignationTypes, newId: string) => {
    if (!user) return

    console.log('formdata', formdata)

    let station = ''
    if (formdata.area_assigned === 'school') {
      const hrmSchool = schools.find(p => p.id.toString() === formdata.school_id?.toString())
      station = hrmSchool ? hrmSchool.name : ''
    } else {
      const hrmOffice = offices.find(p => p.id.toString() === formdata.office_id?.toString())
      station = hrmOffice ? hrmOffice.name : ''
    }

    console.log('station', station)

    const newData = {
      user_id: user.id,
      designation_id: newId,
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
        void logError('Create service record from assignments', 'hrm_service_records', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getUpdatedDropdownData = (formdata: DesignationTypes) => {
    let json = {}
    if (formdata.area_assigned === 'school') {
      // Districts
      const dis = districts.filter(x => x.id.toString() === formdata.district_id)
      if (dis.length > 0) {
        json = { ...json, hrm_districts: { id: dis[0].id, name: dis[0].name } }
      }

      // Schools
      const sch = schools.filter(x => x.id.toString() === formdata.school_id)
      if (sch.length > 0) {
        json = { ...json, hrm_schools: { id: sch[0].id, name: sch[0].name } }
      }
    } else {
      // offices
      const off = offices?.filter(x => x.id.toString() === formdata.office_id)
      if (off.length > 0) {
        json = { ...json, hrm_offices: { id: off[0].id, name: off[0].name } }
      }
    }

    return json
  }

  const validateEmployee = async (formdata: DesignationTypes) => {
    let query = supabase
      .from('hrm_designations')
      .select('*, hrm_users:hrm_user_id(firstname,middlename,lastname),hrm_schools:school_id(name),hrm_offices:office_id(name)')

    if (editData) {
      query = query.neq('id', editData.id)
      query = query.eq('hrm_user_id', editData.hrm_user_id)
    } else {
      query = query.eq('hrm_user_id', user?.id)
    }

    const { data, error }: { data: DesignationTypes[], error: any } = await query

    if (error) console.error(error)

    if (data.length === 0) return false

    const validationErrors: string[] = []

    data.forEach((item) => {
      let station = ''
      if (item.area_assigned !== null) {
        if (item.area_assigned === 'school') {
          station = item.hrm_schools?.name
        } else {
          station = item.hrm_offices?.name
        }
      }

      if (item.status === 'Active') {
        validationErrors.push(`This employee currently have an active designation (Ref Code: ${item.reference_code}) as ${item.designation} ${station}. You cannot create new designation until the active designation is revoked.`)
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

  const handleSelectedUsers = (selectedUsers: namesType[]) => {
    if (selectedUsers.length > 0) {
      if (selectedUsers[0].position_type === 'Teaching') {
        setIsTeaching(true)

        // fetch leave card information
        void handleFetchLeaveCard(selectedUsers[0].id)
      }
      setUser(selectedUsers[0])
    } else {
      setUser(null)
      setIsTeaching(false)
    }
  }

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrict(districtId)
    setLoadingSchools(true)

    const result = await fetchSchools({ filterDistrictId: districtId }, 300, 0)

    setSchools(result.data.length > 0 ? result.data : [])
    setLoadingSchools(false)
  }

  const handleFetchLeaveCard = async (userId: string) => {
    // Count Service Credits balance if teaching
    const result = await fetchLeaveCards(userId, 'Service Credit', 10, 0)
    if (result.count && result.count > 0) {
      // first index of array should be the latest and updated balance
      const sc = result.data[0].balance
      setScBalance(sc)

      // formula to convert sc to vl/sl as amended by CSC MC No.41, s. 1998
      const vlsl = (30 * Number(sc)) / 69
      setVlslBalance(vlsl)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    // display the default values of dynamic dropdowns
    if (editData) {
      setAssignment(editData.area_assigned || '')
      setType(editData.type)
      setIsServiceRecordChecked(editData.add_to_service_record)
      setIsLeaveCardChecked(editData.add_to_leave_card)
      setSelectedDistrict(editData.district_id ?? '')
      setSelectedSchool(editData.school_id ?? '')
      setSelectedOffice(editData.office_id ?? '')

      // Update school list dropdown
      if (editData.area_assigned === 'school') void handleDistrictChange(editData.district_id)
    }

    reset({
      area_assigned: editData ? editData.area_assigned : '',
      district_id: editData ? editData.district_id : '',
      school_id: editData ? editData.school_id : '',
      office_id: editData ? editData.office_id : '',
      from: editData ? editData.from : '',
      type: editData ? editData.type : '',
      designation: editData ? editData.designation : ''
    })

    const fetchDistrictsData = async () => {
      const result = await fetchDistricts('', 300, 0)
      setDistricts(result.data.length > 0 ? result.data : [])
    }

    const fetchOfficesData = async () => {
      const result = await fetchOffices('', 300, 0)
      setOffices(result.data.length > 0 ? result.data : [])
    }

    void fetchDistrictsData()
    void fetchOfficesData()
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Designation Details
            </h5>
            <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            <div className='app__form_field_container'>
              <div className='w-full'>

                {
                  (dataValidationErrors.length > 0 || errorMessage) &&
                    <div className='mb-6'>
                      <div className='font-semebold text-sm font-bold'>Please check the following errors below:</div>
                      {
                        dataValidationErrors.map((error, index) => (
                          <div key={index} className='text-xs text-red-500 mt-2 flex space-x-2'><XCircleIcon className='w-5 h-5'/> <span>{error}</span></div>
                        ))
                      }
                      {errorMessage && <div className='text-xs text-red-500 mt-2 flex space-x-2'><XCircleIcon className='w-5 h-5'/> <span>{errorMessage}</span></div>}
                    </div>
                }

                <div className='app__label_standard'>Employee Name:</div>
                {
                  editData
                    ? <div className='app__label_value'><UserBlock user={editData.hrm_users}/></div>
                    : <SearchUserInput
                        isMultiple={false}
                        handleSelectedUsers={handleSelectedUsers}/>
                }
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Designation</div>
                <div>
                  <input
                    {...register('designation', { required: true })}
                    type='text'
                    className='app__input_standard'/>
                  {errors.designation && <div className='app__error_message'>Designation is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Type</div>
                <div>
                  <select
                    {...register('type', { required: true })}
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className='app__select_standard'>
                      <option value=''>Choose</option>
                      <option value='Function only'>Function only</option>
                      <option value='Function with Station'>Function with Station</option>
                  </select>
                  {errors.type && <div className='app__error_message'>Type is required</div>}
                </div>
              </div>
            </div>
            {
              type === 'Function with Station' &&
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Station</div>
                    <div>
                      <select
                        {...register('area_assigned', { required: true })}
                        value={assignment}
                        onChange={e => setAssignment(e.target.value)}
                        className='app__select_standard'>
                          <option value=''>Choose</option>
                          <option value='school'>School</option>
                          <option value='office'>Division Office</option>
                      </select>
                      {errors.area_assigned && <div className='app__error_message'>Station is required</div>}
                    </div>
                  </div>
                </div>
            }
            {
              (assignment === 'school' && type === 'Function with Station') &&
                <>
                  <div className='app__form_field_container'>
                    <div className='w-full'>
                      <div className='app__label_standard'>Choose district</div>
                      <div>
                        <select
                          {...register('district_id', { required: true })}
                          onChange={async e => await handleDistrictChange(e.target.value)}
                          value={selectedDistrict}
                          className='app__select_standard'>
                            <option value=''>Choose</option>
                            {
                              districts.map((item, index) => (
                                <option key={index} value={item.id}>{item.name}</option>
                              ))
                            }
                        </select>
                        {errors.district_id && <div className='app__error_message'>District is required</div>}
                      </div>
                    </div>
                  </div>
                </>
            }
            {
              loadingSchools &&
                <div className=''>
                  <OneColLayoutLoading rows={1}/>
                </div>
            }
            {
              (assignment === 'school' && type === 'Function with Station' && !loadingSchools) &&
                <>
                  <div className='app__form_field_container'>
                    <div className='w-full'>
                      <div className='app__label_standard'>Choose School</div>
                      <div>
                        <select
                          {...register('school_id', { required: true })}
                          value={selectedSchool}
                          onChange={e => setSelectedSchool(e.target.value)}
                          className='app__select_standard'>
                            <option value=''>Choose</option>
                            {
                              schools.map((item, index) => (
                                <option key={index} value={item.id}>{item.name}</option>
                              ))
                            }
                        </select>
                        {errors.school_id && <div className='app__error_message'>School is required</div>}
                      </div>
                    </div>
                  </div>
                </>
            }
            {
              (assignment === 'office' && type === 'Function with Station') &&
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Choose office</div>
                    <div>
                      <select
                        {...register('office_id', { required: true })}
                        value={selectedOffice}
                        onChange={e => setSelectedOffice(e.target.value)}
                        className='app__select_standard'>
                          <option value=''>Choose</option>
                          {
                            offices.map((item, index) => (
                              <option key={index} value={item.id}>{item.name}</option>
                            ))
                          }
                      </select>
                      {errors.office_id && <div className='app__error_message'>Office is required</div>}
                    </div>
                  </div>
                </div>
            }
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Start Date</div>
                <div>
                  {
                    !editData
                      ? <>
                          <input
                            {...register('from', { required: true })}
                            type='date'
                            className='app__select_standard'/>
                          {errors.from && <div className='app__error_message'>Start Date is required</div>}
                        </>
                      : <div className='app__label_value'>{format(new Date(editData.from), 'MMMM dd, yyyy')}</div>
                  }
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>
                  <label className='flex items-center space-x-1'>
                    {
                      !editData
                        ? <>
                            <input
                              onChange={() => setIsServiceRecordChecked(!isServiceRecordChecked)}
                              checked={isServiceRecordChecked}
                              type='checkbox'
                              className=''/>
                            <span>Include this to Employee&apos;s Service Record</span>
                          </>
                        : <span className='text-xs italic font-normal text-gray-600'>{editData.add_to_service_record ? <span>(Included on Employee&apos;s Service Record)</span> : ''}</span>
                    }
                  </label>
                </div>
              </div>
            </div>
            {
              (!editData && isTeaching) &&
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>
                      <label className='flex items-center space-x-1'>
                        <input
                          onChange={() => setIsLeaveCardChecked(!isLeaveCardChecked)}
                          checked={isLeaveCardChecked}
                          type='checkbox'
                          className=''/>
                        <span>Convert employee&apos;s Service Credits to SL/VL</span>
                      </label>
                    </div>
                    {isLeaveCardChecked && <div className='ml-4 text-xs text-gray-700'><span className='text-green-700 font-bold'>{Number(scBalance).toFixed(3)}</span> Service Credits will be converted to <span className='text-green-700 font-bold'>{(vlslBalance / 2).toFixed(3)}</span> VL and <span className='text-green-700 font-bold'>{(vlslBalance / 2).toFixed(3)}</span> SL</div>}
                  </div>
                </div>
            }
            {
              (!editData && isServiceRecordChecked) &&
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Status</div>
                    <div>
                      <select
                        {...register('service_record_status', { required: true })}
                        className='app__select_standard'>
                          <option value=''>Choose</option>
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
                      {errors.service_record_status && <div className='app__error_message'>Status is required</div>}
                    </div>
                  </div>
                </div>
            }
            <hr className='my-6'/>
            <div className='app__form_field_container'>
              <div className='app__label_standard'>
                <label className='flex items-center space-x-1'>
                  <input
                    {...register('confirmed', { required: true })}
                    type='checkbox'
                    className=''/>
                  <span className='font-normal text-xs'>After submitting, it will make adjustments on emloyee&apos; leave card and service record. By checking this box, you acknowledge that all information is accurate.</span>
                </label>
                {errors.confirmed && <div className='app__error_message'>Confirmation is required</div>}
              </div>
            </div>
            <div className="app__modal_footer">
                  <CustomButton
                    btnType='submit'
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
