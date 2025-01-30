import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { generateReferenceCode } from '@/utils/text-helper'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { CtoTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: CtoTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [totalHours, setTotalHours] = useState('')
  const [cocEquivalent, setCocEquivalent] = useState('')
  const [isHolidayChecked, setIsHolidayChecked] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<CtoTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: CtoTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: CtoTypes) => {
    const coc = isHolidayChecked
      ? Number(formdata.total_hours) * 0.1875
      : Number(formdata.total_hours) * 0.125

    const newData = {
      reference_code: generateReferenceCode(),
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      to: new Date(formdata.to), // use the string data before storing the redux to avoid error
      date_issued: new Date(formdata.date_issued),
      total_hours: formdata.total_hours,
      particulars: formdata.particulars,
      is_holiday: isHolidayChecked,
      coc,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_ctos')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create CTO',
          'hrm_ctos',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      newId = data[0].id // newly created ID

      // Append new data in redux
      const updatedData = {
        ...newData,
        from: formdata.from,
        to: formdata.to,
        date_issued: formdata.date_issued,
        hrm_cto_users: [],
        id: newId
      }
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
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: CtoTypes) => {
    if (!editData) return

    const coc = isHolidayChecked
      ? Number(formdata.total_hours) * 0.1875
      : Number(formdata.total_hours) * 0.125

    const expireDate = new Date(formdata.date_issued)
    expireDate.setFullYear(expireDate.getFullYear() + 1)

    const newData = {
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      to: new Date(formdata.to), // use the string data before storing the redux to avoid error
      date_issued: new Date(formdata.date_issued),
      total_hours: formdata.total_hours,
      particulars: formdata.particulars,
      is_holiday: isHolidayChecked,
      coc
    }

    try {
      const { error } = await supabase
        .from('hrm_ctos')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update CTO',
          'hrm_ctos',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the `page and try again.'
        )
        throw new Error(error.message)
      }

      // update coc  of user ctos
      const { error2 } = await supabase
        .from('hrm_cto_users')
        .update({
          coc
        })
        .eq('cto_id', editData.id)

      if (error2) {
        void logError(
          'Update CTO Users',
          'hrm_cto_users',
          JSON.stringify({ coc }),
          error2.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error2.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = {
        ...newData,
        from: formdata.from,
        to: formdata.to,
        date_issued: formdata.date_issued,
        id: editData.id
      }
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

  const handleHoursChange = (hours: string) => {
    const perHour = isHolidayChecked ? 0.1875 : 0.125
    const coc = Number(hours) * perHour
    setCocEquivalent(`(Equivalent COC: ${coc})`)
    setTotalHours(hours)
  }

  const handleHolidyCheckboxChange = () => {
    const perHour = !isHolidayChecked ? 0.1875 : 0.125
    const coc = Number(totalHours) * perHour
    setCocEquivalent(`(Equivalent COC: ${coc})`)

    setIsHolidayChecked(!isHolidayChecked)
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    if (editData) {
      setTotalHours(editData.total_hours)
      setIsHolidayChecked(editData.is_holiday)

      const perHour = editData.is_holiday ? 0.1875 : 0.125
      const coc = Number(editData.total_hours) * perHour
      setCocEquivalent(`(Equivalent COC: ${coc})`)
    }

    reset({
      from: editData ? editData.from : '',
      to: editData ? editData.to : '',
      date_issued: editData ? editData.date_issued : '',
      expiration: editData ? editData.expiration : '',
      hours: editData ? editData.hours : '',
      days: editData ? editData.days : '',
      total_hours: editData ? editData.total_hours : '',
      particulars: editData ? editData.particulars : '',
      coc: editData ? editData.coc : ''
    })
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">CTO Details</h5>
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
                  <div className="app__label_standard">Date Issued</div>
                  <div>
                    <input
                      {...register('date_issued', { required: true })}
                      type="date"
                      className="app__select_standard"
                    />
                    {errors.from && (
                      <div className="app__error_message">
                        Start Date is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Work Date (From) </div>
                  <div>
                    <input
                      {...register('from', { required: true })}
                      type="date"
                      className="app__select_standard"
                    />
                    {errors.from && (
                      <div className="app__error_message">
                        From Date is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Work Date (To) </div>
                  <div>
                    <input
                      {...register('to', { required: true })}
                      type="date"
                      className="app__select_standard"
                    />
                    {errors.to && (
                      <div className="app__error_message">
                        To Date is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    <label className="flex items-center space-x-1">
                      <input
                        onChange={handleHolidyCheckboxChange}
                        checked={isHolidayChecked}
                        type="checkbox"
                        className=""
                      />
                      <span>This work done on holiday/weeked</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Total Hours of work rendered{' '}
                    <span className="text-green-600">{cocEquivalent}</span>
                  </div>
                  <div>
                    <input
                      {...register('total_hours', { required: true })}
                      type="number"
                      value={totalHours}
                      onChange={(e) => handleHoursChange(e.target.value)}
                      className="app__select_standard"
                    />
                    {errors.total_hours && (
                      <div className="app__error_message">
                        Total Hours is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Particulars</div>
                  <div>
                    <textarea
                      {...register('particulars', { required: true })}
                      rows={5}
                      className="app__select_standard"
                    />
                    {errors.particulars && (
                      <div className="app__error_message">
                        Particulars is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <hr className="my-6" />
              <div className="w-full">
                <div className="app__label_standard">
                  <label className="flex items-center space-x-1">
                    <input
                      {...register('confirmed', { required: true })}
                      type="checkbox"
                      className=""
                    />
                    <span className="font-normal text-xs">
                      By checking this box, you acknowledge that all information
                      are correct. Details can no longer be deleted/modified if
                      there are employees associated to this CTO.
                    </span>
                  </label>
                  {errors.confirmed && (
                    <div className="app__error_message">
                      Confirmation is required
                    </div>
                  )}
                </div>
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? 'Saving...' : 'Save'}
                  containerStyles="app__btn_green"
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
