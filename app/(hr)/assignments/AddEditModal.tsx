import React, { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { XMarkIcon } from '@heroicons/react/24/solid'
import uuid from 'react-uuid'
import { Dialog, Transition } from '@headlessui/react'
import { searchActiveEmployees } from '@/utils/fetchApi'

// Types
import type { Assignment, Office, SchoolTypes, namesType, searchUser } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

interface ModalProps {
  isOpen: boolean
  closeModal: () => void
  editData: Assignment | null
  showingCount: number
  setShowingCount: (count: number) => void
  resultsCount: number
  setResultsCount: (count: number) => void
  schools: SchoolTypes[] | []
  offices: Office[] | []
}

interface FormDataTypes {
  designation: string
  from: string
  to: string
  area_assigned: string
}

const AddEditModal = ({ isOpen, resultsCount, setResultsCount, setShowingCount, showingCount, closeModal, editData, schools, offices }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | ''>('')
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<searchUser[] | []>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])
  const [area, setArea] = useState('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FormDataTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: FormDataTypes) => {
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

  const handleCreate = async (formdata: FormDataTypes) => {
    setSaving(true)

    const newData = {
      designation: formdata.designation,
      from: formdata.from,
      to: formdata.to,
      area_assigned: formdata.area_assigned,
      hrm_user_id: selectedItems[0].id,
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
      const updatedData = { ...newData, id: newId, hrm_users: selectedItems[0] }

      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text
      setResultsCount(resultsCount + 1)
      setShowingCount(showingCount + 1)

      setSaving(false)

      // hide the modal
      closeModal()

      // reset all form fields
      reset()
    }
  }

  const handleUpdate = async (formdata: FormDataTypes) => {
    setSaving(true)

    if (!editData) return

    const newData = {
      designation: formdata.designation,
      from: formdata.from,
      to: formdata.to,
      area_assigned: formdata.area_assigned,
      hrm_user_id: selectedItems[0].id
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
      const updatedData = { ...newData, hrm_users: selectedItems[0], id: editData.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      closeModal()

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
      designation: editData ? editData.designation : '',
      from: editData ? editData.from : '',
      to: editData ? editData.to : '',
      area_assigned: editData ? editData.area_assigned : ''
    })

    // set default values to school head
    setSelectedItems(editData ? (editData.hrm_users ? [editData.hrm_users] : []) : [])
  }, [editData, reset])

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as='div' className='relative z-10' onClose={() => false}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-25'/>
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='app__modal_container'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-out duration-300'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='app__dialog_panel'>
                  <button
                    type='button'
                    className='app__modal_xbtn'
                    onClick={closeModal}
                  >
                    <XMarkIcon className='w-5 h-5'/>
                  </button>

                  <div className='flex-1 flex flex-col gap-2'>
                    {/* Modal Title */}
                    <h5 className="app__modal_title">
                      School Details
                    </h5>

                    {/* Modal Content */}
                    <div className='mt-3'>
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
                                  placeholder='Search Employee Name'
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
                            <div className='app__label_standard'>Designation:</div>
                            <div>
                              <input
                                {...register('designation', { required: true })}
                                type="text"
                                className='app__input_standard'/>
                              {errors.designation && <div className='app__error_message'>Designation is required</div>}
                            </div>
                          </div>
                        </div>
                        <div className='app__form_field_container'>
                          <div className='w-full'>
                            <div className='app__label_standard'>From:</div>
                            <div>
                              <input
                                {...register('from', { required: true })}
                                type="date"
                                className='app__input_standard'/>
                              {errors.from && <div className='app__error_message'>Date (From) is required</div>}
                            </div>
                          </div>
                        </div>
                        <div className='app__form_field_container'>
                          <div className='w-full'>
                            <div className='app__label_standard'>To:</div>
                            <div>
                              <input
                                {...register('to', { required: true })}
                                type="date"
                                className='app__input_standard'/>
                              {errors.to && <div className='app__error_message'>Date (To) is required</div>}
                            </div>
                          </div>
                        </div>
                        <div className='app__form_field_container'>
                          <div className='w-full'>
                            <div className='app__label_standard'>Area Assigned:</div>
                            <div>
                              <select
                                {...register('area_assigned', { required: true })}
                                value={area}
                                onChange={e => setArea(e.target.value)}
                                className='app__select_standard'>
                                  <option value=''>Choose Area</option>
                                  {
                                    schools.map(item => (
                                      <option key={uuid()} value={`school_${item.id}`}>{item.name}</option>
                                    ))
                                  }
                                  {
                                    offices.map(item => (
                                      <option key={uuid()} value={`office_${item.id}`}>{item.name}</option>
                                    ))
                                  }
                              </select>
                              {errors.area_assigned && <div className='app__error_message'>Area assigned is required</div>}
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
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default AddEditModal
