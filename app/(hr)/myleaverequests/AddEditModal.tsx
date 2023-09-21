import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import uuid from 'react-uuid'
import { CustomButton } from '@/components'
import { generateReferenceCode } from '@/utils/text-helper'

// Types
import type { Employee, LeaveTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { XCircleIcon } from '@heroicons/react/24/solid'
import { leaveTypes } from '@/constants/TrackerConstants'

interface ModalProps {
  hideModal: () => void
}

const AddEditModal = ({ hideModal }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [leaveType, setLeaveType] = useState('')
  const [leaveLocation, setLeaveLocation] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const [dataValidationErrors, setDataValidationErrors] = useState<string[] | []>([])
  const [confirmationError, setConfirmationError] = useState('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<LeaveTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: LeaveTypes) => {
    if (saving) return

    if (!isConfirmed) {
      setConfirmationError('You need to acknowledge that all information is accurate and cannot be modified after submission.')
      return
    }

    setSaving(true)

    const hasErrors: boolean = await validateEmployee(formdata)

    if (!hasErrors) {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: LeaveTypes) => {
    const newData = {
      reference_code: generateReferenceCode(),
      requester_id: session.user.id,
      from: new Date(formdata.from), // use the string data before storing the redux to avoid error
      to: new Date(formdata.to), // use the string data before storing the redux to avoid error
      type: formdata.type,
      days: formdata.days,
      location: formdata.location,
      abroad: formdata.abroad,
      hospitalization: formdata.hospitalization,
      illness: formdata.illness,
      study_purpose: formdata.study_purpose,
      other_purpose: formdata.other_purpose,
      hr_status: 'Pending',
      recommending_status: 'Pending',
      approver_status: 'Pending'
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_leave_requests')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      newId = data[0].id // newly created ID use this on 'finally' block
    } catch (e) {
      console.error(e)
    } finally {
      // Append new data in redux
      const userData: Employee[] = systemUsers.filter((item: Employee) => item.id === session.user.id)
      const updatedData = { ...newData, from: formdata.from, to: formdata.from, id: newId, requester: { firstname: userData[0].firstname, middlename: userData[0].middlename, lastname: userData[0].lastname } }
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

  const validateEmployee = async (formdata: LeaveTypes) => {
    const validationErrors: string[] = []

    if (validationErrors.length === 0) {
      return false
    } else {
      setSaving(false)
      setDataValidationErrors(validationErrors)
      return true
    }
  }

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Leave Details
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            <div className='app__form_field_container'>
              <div className='w-full'>
                {
                  (dataValidationErrors.length > 0) &&
                    <div className='mb-6'>
                      <div className='font-semebold text-sm font-bold'>Please check the following errors below:</div>
                      {
                        dataValidationErrors.map((error) => (
                          <div key={uuid()} className='text-xs text-red-500 mt-2 flex space-x-2'><XCircleIcon className='w-5 h-5'/> <span>{error}</span></div>
                        ))
                      }
                    </div>
                }
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Type</div>
                <div>
                  <select
                    {...register('type', { required: true })}
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value)}
                    className='app__select_standard'>
                      <option value=''>Choose</option>
                      {
                        leaveTypes.map(item => <option key={uuid()} value={item}>{item}</option>)
                      }
                  </select>
                  {errors.type && <div className='app__error_message'>Type is required</div>}
                </div>
              </div>
            </div>
            {
              (leaveType === 'Vacation Leave' || leaveType === 'Special Privilege Leave') &&
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Location</div>
                    <div>
                      <select
                        {...register('location', { required: true })}
                        value={leaveLocation}
                        onChange={e => setLeaveLocation(e.target.value)}
                        className='app__select_standard'>
                          <option value=''>Choose</option>
                          <option value='Within the Philippines'>Within the Philippines</option>
                          <option value='Abroad'>Abroad</option>
                      </select>
                      {errors.location && <div className='app__error_message'>Location is required</div>}
                    </div>
                  </div>
                </div>
            }
            {
              leaveLocation === 'Abroad' &&
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>If Abroad, please specify</div>
                    <div>
                      <input
                        {...register('abroad', { required: true })}
                        type='text'
                        className='app__select_standard'/>
                      {errors.abroad && <div className='app__error_message'>Location in abroad is required</div>}
                    </div>
                  </div>
                </div>
            }
            {
              leaveType === 'Sick Leave' &&
                <>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Category</div>
                    <div>
                      <select
                        {...register('hospitalization', { required: true })}
                        className='app__select_standard'>
                          <option value=''>Choose</option>
                          <option value='In Hospital'>In Hospital</option>
                          <option value='Out Patient'>Out Patient</option>
                      </select>
                      {errors.hospitalization && <div className='app__error_message'>Category is required</div>}
                    </div>
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Specify illness</div>
                    <div>
                      <input
                        {...register('illness', { required: true })}
                        type='text'
                        className='app__select_standard'/>
                      {errors.illness && <div className='app__error_message'>Please specify illness</div>}
                    </div>
                  </div>
                </div>
                </>
            }
            {
              leaveType === 'Study Leave' &&
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Purpose</div>
                    <div>
                    <select
                        {...register('study_purpose', { required: true })}
                        className='app__select_standard'>
                          <option value=''>Choose</option>
                          <option value='Completion of Masters Degree'>Completion of Masters Degree</option>
                          <option value='BAR/Board Examination Review'>BAR/Board Examination Review</option>
                      </select>
                      {errors.study_purpose && <div className='app__error_message'>Purpose is required</div>}
                    </div>
                  </div>
                </div>
            }
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Other Purpose (Optional)</div>
                <div>
                  <input
                    {...register('other_purpose')}
                    type='text'
                    className='app__select_standard'/>
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Number of working days applied for</div>
                <div>
                  <input
                    {...register('days', { required: true })}
                    type='number'
                    className='app__select_standard'/>
                  {errors.days && <div className='app__error_message'>Days is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Start Date</div>
                <div>
                  <input
                    {...register('from', { required: true })}
                    type='date'
                    className='app__select_standard'/>
                  {errors.from && <div className='app__error_message'>Start Date is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>End Date</div>
                <div>
                  <input
                    {...register('to', { required: true })}
                    type='date'
                    className='app__select_standard'/>
                  {errors.to && <div className='app__error_message'>End Date is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>
                  <label className='flex items-center space-x-1'>
                    <input
                      onChange={() => setIsConfirmed(!isConfirmed)}
                      checked={isConfirmed}
                      type='checkbox'
                      className=''/>
                    <span className='font-normal text-xs'>By checking this box, you acknowledge that all information is accurate and cannot be modified after submission.</span>
                  </label>
                  {confirmationError !== '' && <div className='app__error_message'>{confirmationError}</div>}
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
