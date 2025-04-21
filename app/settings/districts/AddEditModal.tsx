import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { DistrictTypes, Employee, namesType } from '@/types'

// Redux imports
import { CustomButton, SearchUserInput } from '@/components/index'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: DistrictTypes | null
}

interface FormValues {
  name: string
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | ''>('')

  const [user, setUser] = useState<namesType | null>(
    editData ? (editData.hrm_users ? editData.hrm_users : null) : null
  )

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<FormValues>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: FormValues) => {
    if (!user) {
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
    if (!user) return

    const newData = {
      name: formdata.name,
      head_user_id: user.id,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_districts')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Add district',
          'hrm_districts',
          JSON.stringify(newData),
          error.message
        )
        throw new Error(error.message)
      }

      newId = data[0].id // newly created ID use this on 'finally' block
    } catch (e) {
      console.error(e)
    } finally {
      // Append new data in redux
      const updatedData = { ...newData, id: newId, hrm_users: user }
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
    }
  }

  const handleUpdate = async (formdata: FormValues) => {
    if (!editData) return

    if (!user) return

    const newData = {
      name: formdata.name,
      head_user_id: user.id
    }

    try {
      const { error } = await supabase
        .from('hrm_districts')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update district',
          'hrm_districts',
          JSON.stringify(newData),
          error.message
        )
        throw new Error(error.message)
      }
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, hrm_users: user, id: editData.id }
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

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
    } else {
      setUser(null)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : ''
    })
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">District Details</h5>
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
                  <div className="app__label_standard">District Name:</div>
                  <div>
                    <input
                      {...register('name', { required: true })}
                      type="text"
                      className="app__input_standard"
                    />
                    {errors.name && (
                      <div className="app__error_message">
                        District Name is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">District Head:</div>
                  <SearchUserInput
                    isMultiple={false}
                    selectedUsers={
                      editData
                        ? editData.hrm_users
                          ? [editData.hrm_users]
                          : []
                        : []
                    }
                    handleSelectedUsers={handleSelectedUsers}
                  />
                  {errorMessage && (
                    <div className="app__error_message">{errorMessage}</div>
                  )}
                </div>
              </div>
              <div className="app__modal_footer">
                <button type="submit" className="app__btn_green_sm">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <CustomButton
                  containerStyles="app__btn_gray"
                  title="Cancel"
                  isDisabled={saving}
                  btnType="button"
                  handleClick={hideModal}
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
