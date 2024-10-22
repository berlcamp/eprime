import { CustomButton, SearchUserInput } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { generateReferenceCode } from '@/utils/text-helper'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { Employee, PassSlipTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
}

const PassSlipForm = ({ hideModal }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()

  const [saving, setSaving] = useState(false)
  const [passSlipType, setPassSlipType] = useState('')
  const [approverError, setApproverError] = useState('')

  const currentUser: Employee = systemUsers.find(
    (user: Employee) => user.id === session.user.id
  )

  // selected approver
  const [user, setUser] = useState<Employee | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<PassSlipTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: PassSlipTypes) => {
    if (!user) {
      setApproverError('This field is required')
    }
    await handleCreate(formdata)
  }

  const handleCreate = async (formdata: PassSlipTypes) => {
    if (!user) return

    setSaving(true)

    const refCode = generateReferenceCode()

    try {
      const newData = {
        type: 'Pass Slip',
        reference_code: refCode,
        pass_slip_type: formdata.type,
        pass_slip_intended_time_departure: formdata.intended_time_departure,
        pass_slip_intended_time_arrival: formdata.intended_time_arrival,
        pass_slip_fixed_time_from: formdata.fixed_time_from,
        pass_slip_fixed_time_to: formdata.fixed_time_to,
        pass_slip_purpose: formdata.purpose,
        pass_slip_reason: formdata.reason,
        created_by: session.user.id,
        current_approver_id: session.user.id,
        receiver_id: user.id,
        current_status: 'For Verification',
        current_tracker: 'Forwarded'
      }

      const { data, error }: { data: any; error: any } = await supabase
        .from('hrm_request_trackers')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create Pass Slip Request',
          'hrm_request_trackers',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      const { error: error2 } = await supabase.from('hrm_tracker_flow').insert([
        {
          tracker_id: data[0].id,
          user_id: currentUser.id,
          status: 'For Verification'
        },
        {
          tracker_id: data[0].id,
          user_id: currentUser.id,
          receiver_id: user.id,
          status: 'Forwarded'
        }
      ])

      if (error2) {
        void logError(
          'Create Pass Slip Request Tracker Flow',
          'hrm_tracker_flow',
          JSON.stringify({
            tracker_id: data[0].id,
            user_id: currentUser.id,
            status: 'For Verification'
          }),
          error2.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error2.message)
      }

      // Notify receiver
      void handleNotifyReceiver(data[0].id, user.id, refCode)

      // Append new data in redux
      const updatedData = {
        id: data[0].id,
        creator: currentUser,
        approver: currentUser,
        receiver: user,
        created_at: data[0].created_at,
        document_tracker_stickies: [],
        ...newData
      }
      dispatch(updateList([updatedData, ...globallist]))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1
        })
      )

      // pop up the success message
      setToast('success', 'Successfully saved.')
      setApproverError('')

      // reset all form fields
      reset()

      hideModal()
    } catch (error) {
      console.error('error', error)
    }

    setSaving(false)
  }

  const handleNotifyReceiver = async (
    trackerId: string,
    receiverId: string,
    refCode: string
  ) => {
    //
    try {
      // insert to notifications
      const { error: error3 } = await supabase
        .from('hrm_notifications')
        .insert({
          message: `New Pass Slip Request #${refCode} has been forwarded to you for recommendation/approval.`,
          url: `/tracker/${refCode}`,
          type: 'Forwarded',
          user_id: receiverId,
          request_tracker_id: trackerId,
          reference_table: 'hrm_request_trackers'
        })

      if (error3) {
        throw new Error(error3.message)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
    } else {
      setUser(null)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
          {/* Begin First Column */}
          <div className="w-full px-4">
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Request Permission To</div>
                <div>
                  <select
                    {...register('type', { required: true })}
                    value={passSlipType}
                    onChange={(e) => setPassSlipType(e.target.value)}
                    className="app__select_standard"
                  >
                    <option value="">Choose</option>
                    <option value="Leave the office premises during office hours">
                      Leave the office premises during office hours
                    </option>
                    <option value="Deviate from my fixed time of arrival (Fixed Time)">
                      Deviate from my fixed time of arrival (Fixed Time)
                    </option>
                  </select>
                  {errors.type && (
                    <div className="app__error_message">Type is required</div>
                  )}
                </div>
              </div>
            </div>
            {passSlipType ===
              'Leave the office premises during office hours' && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      Intended time of arrival
                    </div>
                    <div>
                      <input
                        {...register('intended_time_arrival', {
                          required: true
                        })}
                        type="text"
                        placeholder="Intended time of arrival"
                        className="app__input_standard"
                      />
                      {errors.intended_time_arrival && (
                        <div className="app__error_message">
                          Intended time of arrival is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      Intended time of departure
                    </div>
                    <div>
                      <input
                        {...register('intended_time_departure', {
                          required: true
                        })}
                        type="text"
                        placeholder="Intended time of departure"
                        className="app__input_standard"
                      />
                      {errors.intended_time_departure && (
                        <div className="app__error_message">
                          Intended time of departure is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {passSlipType ===
              'Deviate from my fixed time of arrival (Fixed Time)' && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">From</div>
                    <div>
                      <input
                        {...register('fixed_time_from', { required: true })}
                        type="text"
                        placeholder="From (Fixed Time)"
                        className="app__input_standard"
                      />
                      {errors.fixed_time_from && (
                        <div className="app__error_message">
                          This field is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">To</div>
                    <div>
                      <input
                        {...register('fixed_time_to', { required: true })}
                        type="text"
                        placeholder="To"
                        className="app__input_standard"
                      />
                      {errors.fixed_time_to && (
                        <div className="app__error_message">
                          This field is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Purpose</div>
                <div>
                  <select
                    {...register('purpose', { required: true })}
                    className="app__select_standard"
                  >
                    <option value="">Choose</option>
                    <option value="Official">Official</option>
                    <option value="Personal">Personal</option>
                  </select>
                  {errors.purpose && (
                    <div className="app__error_message">
                      Purpose is required
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Reason</div>
                <div>
                  <input
                    {...register('reason', { required: true })}
                    type="text"
                    placeholder="Reason"
                    className="app__select_standard"
                  />
                  {errors.reason && (
                    <div className="app__error_message">Reason is required</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* End First Column */}
          {/* Begin Second Column */}
          <div className="w-full px-4"></div>
          {/* End Second Column */}
        </div>
        <hr className="my-6" />
        <div className="w-full lg:w-1/2 px-4">
          <div className="app__form_field_container">
            <div className="w-full">
              <div className="app__label_standard">
                Submit for Recommendation/Approval To
              </div>
              <SearchUserInput
                isMultiple={false}
                excludedIds={[session.user.id]}
                handleSelectedUsers={handleSelectedUsers}
              />
              {approverError !== '' && (
                <div className="app__error_message">{approverError}</div>
              )}
            </div>
          </div>
        </div>
        <hr className="my-6 mx-4" />
        <div className="w-full px-4">
          <div className="app__label_standard">
            <label className="flex items-center space-x-1">
              <input
                {...register('confirmed', { required: true })}
                type="checkbox"
                className=""
              />
              <span className="font-normal text-xs">
                By checking this box, you acknowledge that all information is
                accurate and cannot be modified after submission.
              </span>
            </label>
            {errors.confirmed && (
              <div className="app__error_message">Confirmation is required</div>
            )}
          </div>
        </div>
        <div className="app__modal_footer px-4">
          <CustomButton
            btnType="submit"
            isDisabled={saving}
            title={saving ? 'Saving...' : 'Save'}
            containerStyles="app__btn_green"
          />
        </div>
      </form>
    </>
  )
}

export default PassSlipForm
