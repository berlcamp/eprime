import { CustomButton } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'
import { holidayTypes } from '@/utils/holiday-helper'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { HolidayTypes } from '@/types'

import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: HolidayTypes | null
}

interface HolidayFormTypes {
  date: string
  name: string
  type: string
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
  } = useForm<HolidayFormTypes>({ mode: 'onSubmit' })

  const onSubmit = async (formdata: HolidayFormTypes) => {
    if (saving) return
    setSaving(true)
    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  // The unique index on hrm_holidays.date rejects duplicates, but a clear
  // message beats a raw Postgres error.
  const isDuplicateDate = (date: string, ignoreId?: string) =>
    globallist.some(
      (item: HolidayTypes) => item.date === date && item.id !== ignoreId
    )

  const handleCreate = async (formdata: HolidayFormTypes) => {
    const newData = {
      date: formdata.date,
      name: formdata.name,
      type: formdata.type
    }

    if (isDuplicateDate(newData.date)) {
      setToast('error', 'A holiday already exists on this date.')
      setSaving(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('hrm_holidays')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create Holiday',
          'hrm_holidays',
          JSON.stringify(newData),
          error.message
        )
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      const updatedData = { ...newData, id: data[0].id }

      dispatch(updateList([updatedData, ...globallist]))
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

  const handleUpdate = async (formdata: HolidayFormTypes) => {
    if (!editData) return

    const newData = {
      date: formdata.date,
      name: formdata.name,
      type: formdata.type
    }

    if (isDuplicateDate(newData.date, editData.id)) {
      setToast('error', 'A holiday already exists on this date.')
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('hrm_holidays')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update Holiday',
          'hrm_holidays',
          JSON.stringify(newData),
          error.message
        )
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      const items = [...globallist]
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
      date: editData?.date ?? '',
      name: editData?.name ?? '',
      type: editData?.type ?? holidayTypes[0]
    })
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Holiday Details</h5>
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
                  <div className="app__label_standard">Date</div>
                  <div>
                    <input
                      type="date"
                      {...register('date', { required: true })}
                      className="app__input_standard"
                    />
                    {errors.date && (
                      <div className="app__error_message">Date is required</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Holiday Name</div>
                  <div>
                    <input
                      {...register('name', { required: true })}
                      placeholder="e.g. Araw ng Kagitingan"
                      className="app__input_standard"
                    />
                    {errors.name && (
                      <div className="app__error_message">Name is required</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Type</div>
                  <div>
                    <select
                      {...register('type', { required: true })}
                      className="app__select_standard"
                    >
                      {holidayTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.type && (
                      <div className="app__error_message">Type is required</div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Both types are skipped when counting leave days. The type is
                    recorded for reference only.
                  </p>
                </div>
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
