import { CustomButton } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { SchoolYearTypes } from '@/types'

import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: SchoolYearTypes | null
}

interface SchoolYearFormTypes {
  title: string
  start_date: string
  end_date: string
  is_active: boolean
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<SchoolYearFormTypes>({ mode: 'onSubmit' })

  const onSubmit = async (formdata: SchoolYearFormTypes) => {
    if (saving) return
    setSaving(true)
    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const deactivateAll = async () => {
    await supabase
      .from('hrm_school_years')
      .update({ is_active: false })
      .eq('is_active', true)
  }

  const handleCreate = async (formdata: SchoolYearFormTypes) => {
    const newData = {
      title: formdata.title,
      start_date: formdata.start_date,
      end_date: formdata.end_date,
      is_active: formdata.is_active || false
    }

    try {
      if (newData.is_active) await deactivateAll()

      const { data, error } = await supabase
        .from('hrm_school_years')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create School Year',
          'hrm_school_years',
          JSON.stringify(newData),
          error.message
        )
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      const updatedData = { ...newData, id: data[0].id }

      // If we set this one active, update existing list items to inactive
      const updatedList = newData.is_active
        ? globallist.map((item: SchoolYearTypes) => ({ ...item, is_active: false }))
        : [...globallist]

      dispatch(updateList([updatedData, ...updatedList]))
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1
        })
      )

      setToast('success', 'Successfully saved.')
      setSaving(false)
      hideModal()
      reset()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const handleUpdate = async (formdata: SchoolYearFormTypes) => {
    if (!editData) return

    const newData = {
      title: formdata.title,
      start_date: formdata.start_date,
      end_date: formdata.end_date,
      is_active: formdata.is_active || false
    }

    try {
      if (newData.is_active) await deactivateAll()

      const { error } = await supabase
        .from('hrm_school_years')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update School Year',
          'hrm_school_years',
          JSON.stringify(newData),
          error.message
        )
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      const items = [...globallist].map((item: SchoolYearTypes) =>
        newData.is_active ? { ...item, is_active: false } : item
      )
      const updatedData = { ...newData, id: editData.id }
      const foundIndex = items.findIndex((x) => x.id === editData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      setToast('success', 'Successfully saved.')
      setSaving(false)
      hideModal()
      reset()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  useEffect(() => {
    reset({
      title: editData?.title ?? '',
      start_date: editData?.start_date ?? '',
      end_date: editData?.end_date ?? '',
      is_active: editData?.is_active ?? false
    })
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">School Year Details</h5>
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
                  <div className="app__label_standard">Title</div>
                  <div>
                    <input
                      {...register('title', { required: true })}
                      placeholder="e.g. 2025-2026"
                      className="app__input_standard"
                    />
                    {errors.title && (
                      <div className="app__error_message">Title is required</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Start Date</div>
                  <div>
                    <input
                      type="date"
                      {...register('start_date', { required: true })}
                      className="app__input_standard"
                    />
                    {errors.start_date && (
                      <div className="app__error_message">Start date is required</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">End Date</div>
                  <div>
                    <input
                      type="date"
                      {...register('end_date', { required: true })}
                      className="app__input_standard"
                    />
                    {errors.end_date && (
                      <div className="app__error_message">End date is required</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="w-4 h-4"
                  />
                  <span>Set as Active School Year</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Checking this will deactivate all other school years.
                </p>
              </div>

              <hr className="my-6" />
              <div className="app__modal_footer">
                <button type="submit" className="app__btn_green_sm">
                  {saving ? 'Saving..' : 'Save'}
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
