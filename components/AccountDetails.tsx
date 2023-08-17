'use client'
import React, { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import OneColLayoutLoading from './Loading/OneColLayoutLoading'
import { superAdmins } from '@/constants/TrackerConstants'
import { fetchDistricts, fetchOffices, fetchPositions, fetchSchools } from '@/utils/fetchApi'
import uuid from 'react-uuid'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

// Types
import { type PositionTypes, type AccountDetailsForm, type SchoolTypes, type DistrictTypes, type Office } from '@/types'

interface ModalProps {
  hideModal: () => void
  id: string
}

const AccountDetails = ({ hideModal, id }: ModalProps) => {
  const { setToast, hasAccess } = useFilter()
  const { supabase, session } = useSupabase()

  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState<PositionTypes[] | []>([])
  const [saving, setSaving] = useState(false)

  const [loadingSchools, setLoadingSchools] = useState(false)
  const [assignment, setAssignment] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [districts, setDistricts] = useState<DistrictTypes[] | null>(null)
  const [offices, setOffices] = useState<Office[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  // Check access from employee_accounts settings or Super Admins
  const isAdmin = hasAccess('employee_accounts') || superAdmins.includes(session.user.email)

  const { register, formState: { errors }, reset, handleSubmit } = useForm<AccountDetailsForm>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: AccountDetailsForm) => {
    if (loading || saving) return

    void handleUpdate(formdata)
  }

  const handleUpdate = async (formdata: AccountDetailsForm) => {
    setSaving(true)

    let newData

    const district = formdata.assignment === 'school' ? Number(formdata.district_id) : null
    const school = formdata.assignment === 'school' ? Number(formdata.school_id) : null
    const office = formdata.assignment === 'office' ? Number(formdata.office_id) : null

    if (isAdmin) {
      newData = {
        firstname: formdata.firstname,
        middlename: formdata.middlename,
        lastname: formdata.lastname,
        assignment: formdata.assignment,
        district_id: district,
        school_id: school,
        office_id: office,
        position_id: formdata.position_id === '' ? null : formdata.position_id,
        salary_grade: formdata.salary_grade,
        salary_step: formdata.salary_step
      }
    } else {
      newData = {
        firstname: formdata.firstname,
        middlename: formdata.middlename,
        lastname: formdata.lastname,
        assignment: formdata.assignment,
        district_id: district,
        school_id: school,
        office_id: office
      }
    }

    try {
      const { error } = await supabase
        .from('hrm_users')
        .update(newData)
        .eq('id', id)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedDropdownData = getUpdatedDropdownData(formdata)
      const updatedData = { ...newData, id, ...updatedDropdownData }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()
    }
  }

  const getUpdatedDropdownData = (formdata: AccountDetailsForm) => {
    let json = {}

    // Positions
    const pos = positions.filter(x => x.id.toString() === formdata.position_id)
    if (pos.length > 0) {
      json = { ...json, hrm_positions: { id: pos[0].id, name: pos[0].name } }
    }

    // schools
    const sch = schools?.filter(x => x.id.toString() === formdata.school_id)
    if (sch.length > 0) {
      json = { ...json, hrm_schools: { id: sch[0].id, name: sch[0].name } }
    }

    // offices
    const off = offices?.filter(x => x.id.toString() === formdata.office_id)
    if (off.length > 0) {
      json = { ...json, hrm_offices: { id: off[0].id, name: off[0].name } }
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

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('hrm_users')
          .select()
          .eq('id', id)
          .limit(1)
          .maybeSingle()

        if (error) throw new Error(error.message)

        setAssignment(data.assignment)
        setSelectedDistrict(data.district_id ?? '')
        setSelectedSchool(data.school_id ?? '')
        setSelectedOffice(data.office_id ?? '')
        setSelectedPosition(data.position_id ?? '')

        // Update school list dropdown
        if (data.assignment === 'school') void handleDistrictChange(data.district_id)

        reset({
          firstname: data ? data.firstname : '',
          middlename: data ? data.middlename : '',
          lastname: data ? data.lastname : '',
          assignment: data ? data.assignment : '',
          district_id: data ? data.district_id : '',
          school_id: data ? data.school_id : '',
          office_id: data ? data.office_id : '',
          position_id: data ? data.position_id : '',
          salary_grade: data ? data.salary_grade : '',
          salary_step: data ? data.salary_step : ''
        })
      } catch (e) {
        console.error('fetch error: ', e)
      } finally {
        setLoading(false)
      }
    }

    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 300, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }

    const fetchDistrictsData = async () => {
      const result = await fetchDistricts('', 300, 0)
      setDistricts(result.data.length > 0 ? result.data : null)
    }

    const fetchOfficesData = async () => {
      const result = await fetchOffices('', 300, 0)
      setOffices(result.data.length > 0 ? result.data : [])
    }

    void fetchDistrictsData()
    void fetchOfficesData()

    void fetchAccountDetails()
    void fetchPositionsData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reset])

  const salaryGradeOptions = []
  for (let i = 1; i <= 33; i++) {
    salaryGradeOptions.push(<option key={i} value={i}>{i}</option>)
  }
  const salaryStepOptions = []
  for (let i = 1; i <= 8; i++) {
    salaryStepOptions.push(<option key={i} value={i}>{i}</option>)
  }

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Account Details
              </h5>
              <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
            </div>

            {/* Modal Content */}
            <div className='app__modal_body'>
              { loading && <OneColLayoutLoading rows={3}/> }
              {
                !loading &&
                  <form onSubmit={handleSubmit(onSubmit)} className="">
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>First Name:</div>
                        <div>
                          <input
                            {...register('firstname', { required: true })}
                            type="text"
                            className='app__input_standard'/>
                          {errors.firstname && <div className='app__error_message'>First Name is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Middle Name:</div>
                        <div>
                          <input
                            {...register('middlename', { required: true })}
                            type="text"
                            className='app__input_standard'/>
                          {errors.middlename && <div className='app__error_message'>Middle Name is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Last Name:</div>
                        <div>
                          <input
                            {...register('lastname', { required: true })}
                            type="text"
                            className='app__input_standard'/>
                          {errors.lastname && <div className='app__error_message'>Last Name is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Original assignment</div>
                        <div>
                          <select
                            {...register('assignment', { required: true })}
                            value={assignment}
                            onChange={e => setAssignment(e.target.value)}
                            className='app__select_standard'>
                              <option value=''>Choose</option>
                              <option value='school'>School</option>
                              <option value='office'>Division Office</option>
                          </select>
                          {errors.assignment && <div className='app__error_message'>Assignment is required</div>}
                        </div>
                      </div>
                    </div>
                    {
                      assignment === 'school' &&
                        <>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Choose district</div>
                              <div>
                                <select
                                  {...register('district_id', { required: true })}
                                  onChange={async e => await handleDistrictChange(e.target.value)}
                                  value={selectedDistrict}
                                  className='app__select_standard'>
                                    <option value=''>Choose</option>
                                    {
                                      districts?.map(item => (
                                        <option key={uuid()} value={item.id}>{item.name}</option>
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
                      (assignment === 'school' && !loadingSchools) &&
                        <>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Choose School</div>
                              <div>
                                <select
                                  {...register('school_id', { required: true })}
                                  value={selectedSchool}
                                  onChange={e => setSelectedSchool(e.target.value)}
                                  className='app__select_standard'>
                                    <option value=''>Choose</option>
                                    {
                                      schools.map(item => (
                                        <option key={uuid()} value={item.id}>{item.name}</option>
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
                      assignment === 'office' &&
                        <div className='app__form_field_container'>
                          <div className='w-full'>
                            <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Choose office</div>
                            <div>
                              <select
                                {...register('office_id', { required: true })}
                                value={selectedOffice}
                                onChange={e => setSelectedOffice(e.target.value)}
                                className='app__select_standard'>
                                  <option value=''>Choose</option>
                                  {
                                    offices.map(item => (
                                      <option key={uuid()} value={item.id}>{item.name}</option>
                                    ))
                                  }
                              </select>
                              {errors.office_id && <div className='app__error_message'>Office is required</div>}
                            </div>
                          </div>
                        </div>
                    }
                    {
                      isAdmin &&
                        <>
                          <div className="flex items-center">
                            <div className="flex-grow bg-gray-300 h-px"></div>
                            <div className="mx-4 text-gray-500 text-sm">Editable only by Administrators</div>
                            <div className="flex-grow bg-gray-300 h-px"></div>
                          </div>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='app__label_standard'>Position:</div>
                              <div>
                                <select
                                  {...register('position_id')}
                                  value={selectedPosition}
                                  onChange={e => setSelectedPosition(e.target.value)}
                                  className='app__input_standard'>
                                    <option value=''>Choose Position</option>
                                    {
                                      positions.map((position: PositionTypes) => <option key={uuid()} value={position.id}>{position.name}</option>)
                                    }
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='app__label_standard'>Salary Grade:</div>
                              <div>
                                <select
                                  {...register('salary_grade')}
                                  className='app__input_standard'>
                                    <option value=''>Choose Salary Grade</option>
                                    {salaryGradeOptions}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='app__label_standard'>Salary Grade (Step):</div>
                              <div>
                                <select
                                  {...register('salary_step')}
                                  className='app__input_standard'>
                                    <option value=''>Choose Salary Grade (Step)</option>
                                    {salaryStepOptions}
                                </select>
                              </div>
                            </div>
                          </div>
                        </>
                    }
                    <div className="app__modal_footer">
                          <button
                            type="submit"
                            className="app__btn_green_sm"
                          >
                            {saving ? 'Saving..' : 'Save'}
                          </button>
                    </div>
                  </form>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountDetails
