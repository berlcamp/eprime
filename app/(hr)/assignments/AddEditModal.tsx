import React, { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'

// Types
import type { AssignmentTypes, DistrictTypes, Office, SchoolTypes, namesType } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { fetchDistricts, fetchOffices, fetchSchools, searchActiveEmployees } from '@/utils/fetchApi'
import uuid from 'react-uuid'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { OneColLayoutLoading } from '@/components'

interface ModalProps {
  hideModal: () => void
  editData: AssignmentTypes | null
}

interface FormValues {
  hrm_user_id: string
  designation: string
  area_assigned: string
  from: string
  to: string
  add_to_service_record: string
  district_id: string
  school_id: string
  office_id: string
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Search employee
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])
  const [errorMessage, setErrorMessage] = useState<string | ''>('')

  const [loadingSchools, setLoadingSchools] = useState(false)
  const [assignment, setAssignment] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [districts, setDistricts] = useState<DistrictTypes[] | null>(null)
  const [offices, setOffices] = useState<Office[] | []>([])

  const [isServiceRecordChecked, setIsServiceRecordChecked] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FormValues>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: FormValues) => {
    if (saving) return

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: FormValues) => {
    if (selectedItems.length === 0) {
      setErrorMessage('Employee Name is Required')
      return
    }

    setSaving(true)

    const newData = {
      hrm_user_id: selectedItems[0].id,
      designation: formdata.designation,
      area_assigned: formdata.area_assigned,
      from: formdata.from,
      to: formdata.to,
      add_to_service_record: isServiceRecordChecked,
      district_id: formdata.district_id,
      school_id: formdata.school_id,
      office_id: formdata.office_id,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_assignments')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      newId = data[0].id // newly created ID use this on 'finally' block
    } catch (e) {
      console.error(e)
    } finally {
      // Append new data in redux
      const updatedData = { ...newData, id: newId }
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
    }
  }

  const handleUpdate = async (formdata: FormValues) => {
    setSaving(true)

    if (!editData) return

    const newData = {
      designation: formdata.designation,
      area_assigned: formdata.area_assigned,
      from: formdata.from,
      to: formdata.to,
      add_to_service_record: formdata.add_to_service_record,
      district_id: formdata.district_id,
      school_id: formdata.school_id,
      office_id: formdata.office_id
    }

    try {
      const { error } = await supabase
        .from('hrm_assignments')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: editData.id }
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
    }
  }

  const handleSearchUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value
    setSearchHead(searchTerm)

    if (searchTerm.trim().length < 3) {
      setSearchResults([])
      return
    }

    const results = await searchActiveEmployees(searchTerm, selectedItems)

    setSearchResults(results)
  }

  const handleSelected = (item: namesType, multiple = false) => {
    if (multiple) {
      setSelectedItems([...selectedItems, item])
    } else {
      setSelectedItems([item])
    }

    setSearchResults([])
    setSearchHead('')
  }
  const handleRemoveSelected = (id: string) => {
    setSelectedItems(prevSelectedItems => prevSelectedItems.filter(item => item.id !== id))
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
    reset({
      designation: editData ? editData.designation : '',
      area_assigned: editData ? editData.area_assigned : '',
      from: editData ? editData.from : '',
      to: editData ? editData.to : '',
      add_to_service_record: editData ? editData.add_to_service_record : ''
    })

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
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Assignment Details
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
          <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Employee Name:</div>
                <div className='app__selected_users_container'>
                  {
                    selectedItems.length > 0 &&
                      selectedItems.map(item => (
                        <div key={uuid()} className='w-full flex mb-1'>
                          <span className='app__selected_user'>
                            {item.firstname} {item.middlename} {item.lastname}
                            <XMarkIcon onClick={() => handleRemoveSelected(item.id)} className='w-4 h-4 ml-2 cursor-pointer'/>
                          </span>
                        </div>
                      ))
                  }
                  <div className='relative'>
                    <input
                      type="text"
                      placeholder='Search Employee'
                      value={searchHead}
                      onChange={async (e) => await handleSearchUser(e)}
                      className='app__input_noborder'/>

                      {
                        searchResults.length > 0 &&
                          <div className='app__search_user_results_container'>
                            {
                              searchResults.map((item: namesType) => (
                                <div
                                  key={uuid()}
                                  onClick={() => handleSelected(item)}
                                  className='app__search_user_results'>
                                    {item.firstname} {item.middlename} {item.lastname}
                                </div>
                              ))
                            }
                          </div>
                      }
                  </div>
                  {errorMessage && <div className='app__error_message'>{errorMessage}</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Area of Assignment</div>
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
                  {errors.area_assigned && <div className='app__error_message'>Assignment is required</div>}
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
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Start Date</div>
                <div>
                  <input
                    {...register('from', { required: true })}
                    type='date'
                    className='app__select_standard'/>
                  {errors.from && <div className='app__error_message'>Start Date is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Expiry Date</div>
                <div>
                  <input
                    {...register('to', { required: true })}
                    type='date'
                    className='app__select_standard'/>
                  {errors.to && <div className='app__error_message'>Expiry Date is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>
                  <label className='flex items-center space-x-1'>
                    <input
                      onChange={handleServiceRecordCheckboxChange}
                      checked={isServiceRecordChecked}
                      type='checkbox'
                      className=''/>
                    <span>Add this to Employees&apos;s Service Record</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="app__modal_footer">
                  <button
                    type="submit"
                    className="app__btn_green_sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
  )
}

export default AddEditModal
