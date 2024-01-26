'use client'
import React, { type ChangeEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import OneColLayoutLoading from './Loading/OneColLayoutLoading'
import { superAdmins } from '@/constants'
import { fetchDistricts, fetchOffices, fetchPositions, fetchSchools, logError } from '@/utils/fetchApi'
import uuid from 'react-uuid'
import Avatar from 'react-avatar'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

// Types
import type { PositionTypes, SchoolTypes, DistrictTypes, Office, Employee } from '@/types'
import { generateReferenceCode } from '@/utils/text-helper'
import CustomButton from './CustomButton'

interface ModalProps {
  hideModal: () => void
  id: string
  shouldUpdateRedux: boolean
}

const AccountDetails = ({ hideModal, shouldUpdateRedux, id }: ModalProps) => {
  const { setToast, hasAccess } = useFilter()
  const { supabase, session } = useSupabase()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [positions, setPositions] = useState<PositionTypes[] | []>([])
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')

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

  const router = useRouter()

  // Check access from employee_accounts settings or Super Admins
  const isAdmin = hasAccess('employee_accounts') || superAdmins.includes(session.user.email)

  const { register, formState: { errors }, reset, handleSubmit } = useForm<Employee>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: Employee) => {
    if (loading || saving) return

    void handleUpdate(formdata)
  }

  const handleUpdate = async (formdata: Employee) => {
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
        birthday: formdata.birthday ? new Date(formdata.birthday) : null, // use the string data before storing the redux to avoid error
        district_id: district,
        school_id: school,
        office_id: office,
        position_id: formdata.position_id ? formdata.position_id : null,
        salary_grade: formdata.salary_grade,
        salary_step: formdata.salary_step,
        position_type: formdata.position_type,
        date_of_last_promotion: formdata.date_of_last_promotion ? new Date(formdata.date_of_last_promotion) : null, // use the string data before storing the redux to avoid error
        joining_date: formdata.joining_date ? new Date(formdata.joining_date) : null // use the string data before storing the redux to avoid error
      }
    } else {
      newData = {
        firstname: formdata.firstname,
        middlename: formdata.middlename,
        lastname: formdata.lastname,
        assignment: formdata.assignment,
        birthday: formdata.birthday ? new Date(formdata.birthday) : null, // use the string data before storing the redux to avoid error
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

      if (error) {
        void logError('Update account details', 'hrm_assignments', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // Update data in redux
      if (shouldUpdateRedux) {
        console.log('redux updated')
        const items = [...globallist]
        const updatedDropdownData = getUpdatedDropdownData(formdata)
        const updatedData = { ...newData, birthday: formdata.birthday, joining_date: formdata.joining_date, date_of_last_promotion: formdata.date_of_last_promotion, id, ...updatedDropdownData }
        const foundIndex = items.findIndex(x => x.id === updatedData.id)
        items[foundIndex] = { ...items[foundIndex], ...updatedData }
        dispatch(updateList(items))
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const getUpdatedDropdownData = (formdata: Employee) => {
    let json = {}

    // Positions
    const pos = positions.filter(x => x.id.toString() === formdata.position_id.toString())
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

  const handleUploadPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        setUploading(true)

        // delete the existing user avatar on supabase storage
        const { data: files, error: error3 } = await supabase.storage.from('hrm_public').list(`user_avatar/${id}`)
        if (error3) throw new Error(error3.message)
        if (files.length > 0) {
          const filesToRemove = files.map((x: { name: string }) => `user_avatar/${id}/${x.name}`)
          const { error: error4 } = await supabase.storage.from('hrm_public').remove(filesToRemove)
          if (error4) throw new Error(error4.message)
        }

        // upload the new avatar
        const file = e.target.files?.[0]
        const newFileName = generateReferenceCode()
        const customFilePath = `user_avatar/${id}/${newFileName}.` + (file.name.split('.').pop() as string)
        const { error } = await supabase
          .storage
          .from('hrm_public')
          .upload(`${customFilePath}`, file, {
            cacheControl: '3600',
            upsert: true
          })
        if (error) throw new Error(error.message)

        // get the newly uploaded file public path
        await handleFetchAvatar(customFilePath)
      } catch (error) {
        console.error('Error uploading file:', error)
      } finally {
        router.refresh()
        setUploading(false)
      }
    }
  }

  const handleFetchAvatar = async (path: string) => {
    try {
      // get the public avatar url
      const { data, error } = await supabase
        .storage
        .from('hrm_public')
        .getPublicUrl(`${path}`)

      if (error) throw new Error(error.message)

      // update avatar url on hrm_users table
      const { error2 } = await supabase
        .from('hrm_users')
        .update({ avatar_url: data.publicUrl })
        .eq('id', id)

      if (error2) throw new Error(error2.message)

      setAvatarUrl(data.publicUrl)
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
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
          .single()

        if (error) throw new Error(error.message)

        setAvatarUrl(data.avatar_url)
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
          birthday: (data?.birthday) ? data.birthday : '',
          district_id: data ? data.district_id : '',
          school_id: data ? data.school_id : '',
          office_id: data ? data.office_id : '',
          position_id: data ? data.position_id : '',
          position_type: data ? data.position_type : '',
          salary_grade: data ? data.salary_grade : '',
          salary_step: data ? data.salary_step : '',
          joining_date: (data?.joining_date) ? data.joining_date : '',
          date_of_last_promotion: (data?.date_of_last_promotion) ? data.date_of_last_promotion : ''
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
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                isDisabled={saving}
                btnType='button'
                handleClick={hideModal}
              />
            </div>

            {/* Modal Content */}
            <div className='app__modal_body'>
              { loading && <OneColLayoutLoading rows={3}/> }
              {
                !loading &&
                  <form onSubmit={handleSubmit(onSubmit)} className="">
                    <div className='text-center'>
                      {
                        (avatarUrl && avatarUrl !== '')
                          ? <Image src={avatarUrl} width={60} height={60} alt="alt" className='mx-auto'/>
                          : <Avatar round={false} size="60" name={session.user.email.split('@')[0]} />
                      }
                      <div className="relative">
                        <input type="file" onChange={handleUploadPhoto} className="hidden" id="file-input" accept="image/*"/>
                        {
                          !uploading
                            ? <label htmlFor="file-input" className="cursor-pointer py-px px-1 text-xs text-blue-600">
                                Change Profile Photo
                              </label>
                            : <span className='py-px px-1 text-xs text-blue-600'>Uploading...</span>
                        }
                      </div>
                    </div>
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
                            {...register('middlename')}
                            type="text"
                            className='app__input_standard'/>
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
                        <div className='app__label_standard'>Birthday:</div>
                        <div>
                          <input
                            {...register('birthday')}
                            type="date"
                            className='app__input_standard'/>
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Original assignment</div>
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
                              <div className='app__label_standard'>Choose district</div>
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
                              <div className='app__label_standard'>Choose School</div>
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
                            <div className='app__label_standard'>Choose office</div>
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
                              <div className='app__label_standard'>Current Position:</div>
                              <div>
                                <select
                                  {...register('position_id', { required: true })}
                                  value={selectedPosition}
                                  onChange={e => setSelectedPosition(e.target.value)}
                                  className='app__input_standard'>
                                    <option value=''>Choose Position</option>
                                    {
                                      positions.map((position: PositionTypes) => <option key={uuid()} value={position.id}>{position.name}</option>)
                                    }
                                </select>
                                {errors.position_id && <div className='app__error_message'>Current Position is required</div>}
                              </div>
                            </div>
                          </div>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='app__label_standard'>Position Type:</div>
                              <div>
                                <select
                                  {...register('position_type', { required: true })}
                                  className='app__input_standard'>
                                    <option value=''>Choose Type</option>
                                    <option value='Teaching'>Teaching</option>
                                    <option value='Non-teaching'>Non-teaching</option>
                                </select>
                                {errors.position_type && <div className='app__error_message'>Position Type is required</div>}
                              </div>
                            </div>
                          </div>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='app__label_standard'>Current Salary Grade:</div>
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
                              <div className='app__label_standard'>Current Salary Grade (Step):</div>
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
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='app__label_standard'>Joining Date:</div>
                              <div>
                                <input
                                  {...register('joining_date')}
                                  type="date"
                                  className='app__input_standard'/>
                              </div>
                            </div>
                          </div>
                          <div className='app__form_field_container'>
                            <div className='w-full'>
                              <div className='app__label_standard'>Date of last Promotion:</div>
                              <div>
                                <input
                                  {...register('date_of_last_promotion')}
                                  type="date"
                                  className='app__input_standard'/>
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
