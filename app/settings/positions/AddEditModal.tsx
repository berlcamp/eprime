import React, { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'

// Types
import type { PositionTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { CustomButton } from '@/components'

interface ModalProps {
  hideModal: () => void
  editData: PositionTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<PositionTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: PositionTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: PositionTypes) => {
    const newData = {
      name: formdata.name,
      type: formdata.type,
      salary_grade: formdata.salary_grade,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_positions')
        .insert(newData)
        .select()

      if (error) {
        void logError('Create positions', 'hrm_positions', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      newId = data[0].id

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
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: PositionTypes) => {
    if (!editData) return

    const newData = {
      name: formdata.name,
      type: formdata.type,
      salary_grade: formdata.salary_grade
    }

    try {
      const { error } = await supabase
        .from('hrm_positions')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError('Update positions', 'hrm_positions', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

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
    } catch (e) {
      console.error(e)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : '',
      type: editData ? editData.type : '',
      salary_grade: editData ? editData.salary_grade : ''
    })
  }, [editData, reset])

  const salaryGradeOptions = []
  for (let i = 1; i <= 33; i++) {
    salaryGradeOptions.push(<option key={i} value={i}>{i}</option>)
  }

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Position Details
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
                <div className='app__label_standard'>Position Name:</div>
                <div>
                  <input
                    {...register('name', { required: true })}
                    type="text"
                    className='app__input_standard'/>
                  {errors.name && <div className='app__error_message'>Position Name is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Type:</div>
                <div>
                  <select
                    {...register('type', { required: true })}
                    className='app__input_standard'>
                      <option value=''>Choose Type</option>
                      <option value='Teaching'>Teaching</option>
                      <option value='Non-teaching'>Non-teaching</option>
                  </select>
                  {errors.type && <div className='app__error_message'>Type is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Salary Grade:</div>
                <div>
                  <select
                    {...register('salary_grade', { required: true })}
                    className='app__input_standard'>
                      {salaryGradeOptions}
                  </select>
                  {errors.name && <div className='app__error_message'>Salary Grade is required</div>}
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
