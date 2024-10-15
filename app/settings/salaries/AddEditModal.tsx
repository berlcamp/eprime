import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { SalaryGradeTypes } from '@/types'

// Redux imports
import { CustomButton } from '@/components'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { logError } from '@/utils/fetchApi'
import { formatToPesos } from '@/utils/text-helper'
import { format } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: SalaryGradeTypes
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<SalaryGradeTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: SalaryGradeTypes) => {
    if (saving) return

    setSaving(true)

    void handleUpdate(formdata)
  }

  const handleUpdate = async (formdata: SalaryGradeTypes) => {
    if (!editData) return

    const updatedLogs = [
      ...(editData.logs ?? []),
      {
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        user_name: session.user.email,
        message: `Updated salary from ${formatToPesos(
          Number(editData.salary)
        )} to ${formatToPesos(Number(formdata.salary))}`
      }
    ]

    const newData = {
      salary: formdata.salary,
      logs: updatedLogs
    }

    try {
      const { error } = await supabase
        .from('hrm_salaries')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update salary',
          'hrm_salaries',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: editData.id }
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
    } catch (e) {
      console.error(e)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      salary: editData ? editData.salary : ''
    })
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Salary Details</h5>
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
                  <div className="app__label_standard">Grade:</div>
                  <div>{editData?.grade}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Step:</div>
                  <div>{editData?.step}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Salary:</div>
                  <div>
                    <input
                      {...register('salary', { required: true })}
                      type="text"
                      className="app__input_standard"
                    />
                    {errors.salary && (
                      <div className="app__error_message">
                        Salary is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__modal_footer">
                <button type="submit" className="app__btn_green_sm">
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
