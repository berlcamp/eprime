import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'
import { generateReferenceCode } from '@/utils/text-helper'

// Types
import type { ServiceCreditTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

interface ModalProps {
  hideModal: () => void
  editData: ServiceCreditTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [totalHours, setTotalHours] = useState('')
  const [serviceCreditEquivalent, setServiceCreditEquivalent] = useState('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<ServiceCreditTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: ServiceCreditTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: ServiceCreditTypes) => {
    const serviceCredits = Number(formdata.total_hours) * 0.125

    const newData = {
      reference_code: generateReferenceCode(),
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      to: new Date(formdata.to), // use the string data before storing the redux to avoid error
      date_issued: new Date(formdata.date_issued),
      total_hours: formdata.total_hours,
      particulars: formdata.particulars,
      service_credits: serviceCredits,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_service_credits')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      newId = data[0].id // newly created ID use this on 'finally' block
    } catch (e) {
      console.error(e)
    } finally {
      // Append new data in redux
      const updatedData = { ...newData, from: formdata.from, to: formdata.to, date_issued: formdata.date_issued, hrm_service_credit_users: [], id: newId }
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

  const handleUpdate = async (formdata: ServiceCreditTypes) => {
    if (!editData) return

    const serviceCredits = Number(formdata.total_hours) * 0.125

    const newData = {
      reference_code: generateReferenceCode(),
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      to: new Date(formdata.to), // use the string data before storing the redux to avoid error
      date_issued: new Date(formdata.date_issued),
      total_hours: formdata.total_hours,
      particulars: formdata.particulars,
      service_credits: serviceCredits
    }

    try {
      const { error } = await supabase
        .from('hrm_service_credits')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)

      // update service_credits of service credit users
      const { error2 } = await supabase
        .from('hrm_service_credit_users')
        .update({
          service_credits: serviceCredits
        })
        .eq('service_credit_id', editData.id)

      if (error2) throw new Error(error2.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, from: formdata.from, to: formdata.to, date_issued: formdata.date_issued, id: editData.id }
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

  const handleHoursChange = (hours: string) => {
    const perHour = 0.125
    const sc = Number(hours) * perHour
    setServiceCreditEquivalent(`(Equivalent Service Credit: ${sc})`)
    setTotalHours(hours)
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    if (editData) {
      setTotalHours(editData.total_hours)

      const perHour = 0.125
      const coc = Number(editData.total_hours) * perHour
      setServiceCreditEquivalent(`(Equivalent Service Credit: ${coc})`)
    }

    reset({
      from: editData ? editData.from : '',
      to: editData ? editData.to : '',
      date_issued: editData ? editData.date_issued : '',
      hours: editData ? editData.hours : '',
      total_hours: editData ? editData.total_hours : '',
      particulars: editData ? editData.particulars : ''
    })
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Service Credit Details
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Date Issued</div>
                <div>
                  <input
                    {...register('date_issued', { required: true })}
                    type='date'
                    className='app__select_standard'/>
                  {errors.from && <div className='app__error_message'>Start Date is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Work Date (From) </div>
                <div>
                  <input
                    {...register('from', { required: true })}
                    type='date'
                    className='app__select_standard'/>
                  {errors.from && <div className='app__error_message'>From Date is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Work Date (To) </div>
                <div>
                  <input
                    {...register('to', { required: true })}
                    type='date'
                    className='app__select_standard'/>
                  {errors.to && <div className='app__error_message'>To Date is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Total Hours of work rendered <span className='text-green-600'>{serviceCreditEquivalent}</span></div>
                <div>
                  <input
                    {...register('total_hours', { required: true })}
                    type='number'
                    value={totalHours}
                    onChange={e => handleHoursChange(e.target.value)}
                    className='app__select_standard'/>
                  {errors.total_hours && <div className='app__error_message'>Total Hours is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Particulars</div>
                <div>
                  <textarea
                    {...register('particulars', { required: true })}
                    rows={5}
                    className='app__select_standard'/>
                  {errors.particulars && <div className='app__error_message'>Particulars is required</div>}
                </div>
              </div>
            </div>
            <div className="app__modal_footer">
                  <CustomButton
                    btnType='submit'
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
