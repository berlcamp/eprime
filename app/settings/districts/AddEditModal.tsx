import React, { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { XMarkIcon } from '@heroicons/react/24/solid'

// Types
import type { DistrictTypes, Employee, namesType } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { CustomButton, UserBlock } from '@/components'

interface ModalProps {
  hideModal: () => void
  editData: DistrictTypes | null
}

interface FormValues {
  name: string
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, systemUsers }: { systemUsers: Employee[], supabase: any } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | ''>('')

  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FormValues>({
    mode: 'onSubmit'
  })

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : ''
    })

    // set default values to district head
    setSelectedItems(editData ? (editData.hrm_users ? [editData.hrm_users] : []) : [])
  }, [editData, reset])

  const onSubmit = async (formdata: FormValues) => {
    if (selectedItems.length === 0) {
      setErrorMessage('District Head is Required')
      return
    }

    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: FormValues) => {
    const newData = {
      name: formdata.name,
      head_user_id: selectedItems[0].id,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_districts')
        .insert(newData)
        .select()

      if (error) {
        void logError('Add district', 'hrm_districts', JSON.stringify(newData), error.message)
        throw new Error(error.message)
      }

      newId = data[0].id // newly created ID use this on 'finally' block
    } catch (e) {
      console.error(e)
    } finally {
      // Append new data in redux
      const updatedData = { ...newData, id: newId, hrm_users: selectedItems[0] }
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
    if (!editData) return

    const newData = {
      name: formdata.name,
      head_user_id: selectedItems[0].id
    }

    try {
      const { error } = await supabase
        .from('hrm_districts')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError('Update district', 'hrm_districts', JSON.stringify(newData), error.message)
        throw new Error(error.message)
      }
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

    // Search user
    const searchWords = (e.target.value).split(' ')
    const results = systemUsers.filter(user => {
      // exclude already selected users
      if (selectedItems.some(obj => obj.id.toString() === user.id.toString())) return false

      const fullName = `${user.lastname} ${user.firstname} ${user.middlename}`.toLowerCase()
      return searchWords.every(word => fullName.includes(word))
    })

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

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                District Details
              </h5>
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                isDisabled={saving}
                btnType='button'
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>District Name:</div>
                  <div>
                    <input
                      {...register('name', { required: true })}
                      type="text"
                      className='app__input_standard'/>
                    {errors.name && <div className='app__error_message'>District Name is required</div>}
                  </div>
                </div>
              </div>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>District Head:</div>
                  <div className='app__selected_users_container'>
                    {
                      selectedItems.length > 0 &&
                        selectedItems.map((item, index) => (
                          <div key={index} className='w-full flex mb-1'>
                            <span className='app__selected_user'>
                              {item.firstname} {item.middlename} {item.lastname}
                              <XMarkIcon onClick={() => handleRemoveSelected(item.id)} className='w-4 h-4 ml-2 cursor-pointer'/>
                            </span>
                          </div>
                        ))
                    }
                    {
                      selectedItems.length === 0 &&
                        <div className='relative'>
                          <input
                            type="text"
                            placeholder='Search employee..'
                            value={searchHead}
                            onChange={async (e) => await handleSearchUser(e)}
                            className='app__input_noborder'/>

                            {
                              searchResults.length > 0 &&
                                <div className='app__search_user_results_container'>
                                  {
                                    searchResults.map((item: namesType, index) => (
                                      <div
                                        key={index}
                                        onClick={() => handleSelected(item)}
                                        className='app__search_user_results'>
                                          <UserBlock user={item}/>
                                      </div>
                                    ))
                                  }
                                </div>
                            }
                        </div>
                    }
                  </div>
                  {errorMessage && <div className='app__error_message'>{errorMessage}</div>}
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
