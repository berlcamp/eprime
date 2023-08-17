import React, { Fragment, useState, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { XMarkIcon } from '@heroicons/react/24/solid'
import uuid from 'react-uuid'
import { fetchDistricts, searchActiveEmployees } from '@/utils/fetchApi'

// Types
import type { DistrictTypes, SchoolTypes, namesType, searchUser } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

const classList = [
  'IP School',
  'Madrata',
  'Senior High School Only',
  'Integrated'
]

interface ModalProps {
  hideModal: () => void
  editData: SchoolTypes | null
}

interface SchoolForm {
  name: string
  type: string
  district_id: string
  size: string
  school_id: string
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | ''>('')
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<searchUser[] | []>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])
  const [districtId, setDistrictId] = useState(editData ? (editData.district_id ? editData.district_id : '') : '')
  const [districts, setDistricts] = useState<DistrictTypes[] | null>(null)
  const [selectedClass, setSelectedClass] = useState<never[] | []>(editData ? (editData.school_class ? editData.school_class : []) : [])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<SchoolForm>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: SchoolForm) => {
    if (selectedItems.length === 0) {
      setErrorMessage('School Head is Required')
      return
    }

    if (saving) return

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: SchoolForm) => {
    //
    const selectedDistrict = districts?.filter(d => d.id.toString() === formdata.district_id)

    const newData = {
      name: formdata.name,
      type: formdata.type,
      school_class: selectedClass,
      size: formdata.size,
      school_id: formdata.school_id,
      head_user_id: selectedItems[0].id,
      district_id: formdata.district_id,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_schools')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      newId = data[0].id // newly created ID use this on 'finally' block
    } catch (e) {
      console.error(e)
    } finally {
      // Append new data in redux
      const updatedData = { ...newData, id: newId, hrm_users: selectedItems[0], hrm_districts: { name: selectedDistrict ? selectedDistrict[0].name : '' } }

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

  const handleUpdate = async (formdata: SchoolForm) => {
    setSaving(true)

    if (!editData) return

    const selectedDistrict = districts?.filter(d => d.id.toString() === formdata.district_id.toString())

    const newData = {
      name: formdata.name,
      type: formdata.type,
      school_class: selectedClass,
      size: formdata.size,
      school_id: formdata.school_id,
      head_user_id: selectedItems[0].id,
      district_id: formdata.district_id,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    try {
      const { error } = await supabase
        .from('hrm_schools')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, hrm_users: selectedItems[0], id: editData.id, hrm_districts: { name: selectedDistrict ? selectedDistrict[0].name : '' } }
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
    setErrorMessage('')

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

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : '',
      type: editData ? editData.type : '',
      size: editData ? editData.size : '',
      school_id: editData ? editData.school_id : '',
      district_id: editData ? editData.district_id : ''
    })

    // Reset dynamic dropdowns
    setDistrictId(editData ? (editData.district_id ? editData.district_id : '') : '')

    // set default values to school head
    setSelectedItems(editData ? (editData.hrm_users ? [editData.hrm_users] : []) : [])
  }, [editData, reset])

  useEffect(() => {
    const fetchDistrictsData = async () => {
      const result = await fetchDistricts('', 300, 0)
      setDistricts(result.data.length > 0 ? result.data : null)
    }

    console.log('fetched districts ')
    void fetchDistrictsData()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                School Details
              </h5>
              <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>Type:</div>
                  <div>
                    <select
                      {...register('type', { required: true })}
                      className='app__select_standard'>
                        <option value=''>Choose Type</option>
                        <option value='Elementary'>Elementary</option>
                        <option value='Secondary'>Secondary</option>
                        <option value='Senior Highschool'>Senior Highschool</option>
                        <option value='SPED Centers'>SPED Centers</option>
                    </select>
                    {errors.type && <div className='app__error_message'>Type is required</div>}
                  </div>
                </div>
              </div>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>Size:</div>
                  <div>
                    <select
                      {...register('size', { required: true })}
                      className='app__select_standard'>
                        <option value=''>Choose Size</option>
                        <option value='Very Small'>Very Small</option>
                        <option value='Small'>Small</option>
                        <option value='Medium'>Medium</option>
                        <option value='Large'>Large</option>
                        <option value='Very Large'>Very Large</option>
                    </select>
                    {errors.size && <div className='app__error_message'>Size is required</div>}
                  </div>
                </div>
              </div>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>Class:</div>
                  <div>
                    <div className="w-full">
                      <Listbox value={selectedClass} onChange={setSelectedClass} multiple>
                        <div className="relative">
                          <Listbox.Button className="app__listbox_btn">
                            <span className="block truncate text-xs">
                              &nbsp;{selectedClass.map((item: string) => item).join(', ')}
                            </span>
                            <span className="app__listbox_icon">
                              <ChevronDownIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="app__listbox_options">
                              {classList.map((item, itemIdx) => (
                                <Listbox.Option
                                  key={itemIdx}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                                    }`
                                  }
                                  value={item}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate text-xs ${
                                          selected ? 'font-medium' : 'font-normal'
                                        }`}
                                      >
                                        {item}
                                      </span>
                                      {
                                        selected
                                          ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                            )
                                          : null
                                      }
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>
                </div>
              </div>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>School Name:</div>
                  <div>
                    <input
                      {...register('name', { required: true })}
                      type="text"
                      className='app__input_standard'/>
                    {errors.name && <div className='app__error_message'>School Name is required</div>}
                  </div>
                </div>
              </div>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>School ID:</div>
                  <div>
                    <input
                      {...register('school_id', { required: true })}
                      type="text"
                      className='app__input_standard'/>
                    {errors.school_id && <div className='app__error_message'>School Name is required</div>}
                  </div>
                </div>
              </div>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>School Head:</div>
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
                        placeholder='Search School Head'
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
                  </div>
                  {errorMessage && <div className='app__error_message'>{errorMessage}</div>}
                </div>
              </div>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>District:</div>
                  <div>
                    <select
                      {...register('district_id', { required: true })}
                      value={districtId}
                      onChange={e => setDistrictId(e.target.value)}
                      className='app__select_standard'>
                        <option value=''>Choose District</option>
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
