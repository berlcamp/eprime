import { CustomButton, SearchUserInput } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { generateReferenceCode } from '@/utils/text-helper'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { Employee, UndertimePermitTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
}

const UndertimeForm = ({ hideModal }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()

  const [saving, setSaving] = useState(false)
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
  } = useForm<UndertimePermitTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: UndertimePermitTypes) => {
    if (!user) {
      setApproverError('This field is required')
    }
    await handleCreate(formdata)
  }

  const handleCreate = async (formdata: UndertimePermitTypes) => {
    if (!user) return

    setSaving(true)

    const refCode = generateReferenceCode()

    try {
      const newData = {
        type: 'Undertime Permit',
        reference_code: refCode,
        undertime_permit_reason: formdata.reason,
        undertime_permit_time: formdata.time,
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
          'Create Undertime Permit',
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
          'Create Undertime Permit Tracker Flow',
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
          message: `Undertime Request #${refCode} has been forwarded to you for recommendation/approval.`,
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
                <div className="app__label_standard">
                  Time to leave on office
                </div>
                <div>
                  <input
                    {...register('time', { required: true })}
                    type="time"
                    className="app__select_standard"
                  />
                  {errors.time && (
                    <div className="app__error_message">Time is required</div>
                  )}
                </div>
              </div>
            </div>
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Reason</div>
                <div>
                  <textarea
                    {...register('reason', { required: true })}
                    placeholder="Reason"
                    className="app__input_standard"
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

export default UndertimeForm
