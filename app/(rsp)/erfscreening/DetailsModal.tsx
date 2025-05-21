/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'

import { updateList } from '@/GlobalRedux/Features/listSlice'
import {
  ConfirmModal,
  CustomButton,
  SearchUserInput,
  UserBlock
} from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import type { ApplicantTypes, Employee, namesType } from '@/types'
import { logError } from '@/utils/fetchApi'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import EquivalentUnits from './EquivalentUnits'
import Remarks from './Remarks'
import StatusFlow from './StatusFlow'

interface ModalProps {
  hideModal: () => void
  documentData: ApplicantTypes
}

export default function DetailsModal({ hideModal, documentData }: ModalProps) {
  const [saving, setSaving] = useState(false)

  const [showConfirmModal, setShowConfirmModal] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')

  const [updateStatusFlow, setUpdateStatusFlow] = useState(false)

  // Forward to this user
  const [selectedUser, setSelectedUser] = useState<namesType | null>(null)

  const { systemUsers, session, supabase } = useSupabase()

  const { setToast } = useFilter()

  const wrapperRef = useRef<HTMLDivElement>(null)

  const user: Employee = systemUsers.find(
    (user: Employee) => user.id === session?.user.id
  )

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const handleNotify = async (document: ApplicantTypes, actionType: string) => {
    //
    try {
      const notificationData: any[] = []

      const message =
        actionType === 'Forwarded'
          ? `The Reclassication Application #${document.code} has been forwarded to you for verification/approval.`
          : `The status of Reclassication Application #${document.code} has been changed to ${actionType}.`

      notificationData.push({
        message,
        url: `/erfscreening/${document.code}`,
        type: actionType,
        user_id: document.user_id,
        reference_table: 'hrm_ranking_applicants'
      })

      if (notificationData.length > 0) {
        // insert to notifications
        const { error: error3 } = await supabase
          .from('hrm_notifications')
          .insert(notificationData)

        if (error3) {
          throw new Error(error3.message)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  // display confirm modal
  const HandleConfirm = (action: string) => {
    if (action === 'Verified By AO') {
      setConfirmMessage('Are you sure you want to perform this action?')
    }
    if (action === 'Verified By HR') {
      setConfirmMessage('Are you sure you want to perform this action?')
    }
    if (action === 'Not Qualified') {
      setConfirmMessage('Are you sure you want to perform this action?')
    }
    if (action === 'Forward') {
      if (!selectedUser) {
        return
      }
      setConfirmMessage('Are you sure you want to Forward this request?')
    }

    setShowConfirmModal(action)
  }

  // based from confirm modal
  const HandleOnConfirm = () => {
    if (showConfirmModal === 'Forward') {
      void handleConfirmedForward()
    }
    if (showConfirmModal === 'Verified By AO') {
      void handleVerifiedAO()
    }
    if (showConfirmModal === 'Verified By HR') {
      void handleVerifiedHR()
    }
    if (showConfirmModal === 'Not Qualified') {
      void handleNotQualified()
    }

    setShowConfirmModal('')
    setConfirmMessage('')
  }

  // based from confirm modal
  const handleOnCancel = () => {
    // hide the modal
    setShowConfirmModal('')
    setConfirmMessage('')
  }

  const handleNotQualified = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      status: 'Not Qualified'
    }
    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError(
          'Not Qualified',
          'hrm_ranking_applicants',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Status flow
      const { error: error2 } = await supabase
        .from('hrm_ranking_applicant_flow')
        .insert({
          applicant_id: documentData.id,
          user_id: user.id,
          receiver_id: user.id,
          status: 'Not Qualified'
        })

      if (error2) {
        void logError(
          'Not Qualified',
          'hrm_ranking_applicant_flow',
          '',
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
        id: documentData.id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setUpdateStatusFlow(!updateStatusFlow)

      // Notify requester and follower
      void handleNotify(items[foundIndex], 'Not Qualified')

      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleVerifiedHR = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      status: 'Verified By HR'
    }
    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError(
          'Verified By HR',
          'hrm_ranking_applicants',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Status flow
      const { error: error2 } = await supabase
        .from('hrm_ranking_applicant_flow')
        .insert({
          applicant_id: documentData.id,
          user_id: user.id,
          receiver_id: user.id,
          status: 'Verified By HR'
        })

      if (error2) {
        void logError(
          'Forward Request Flow',
          'hrm_ranking_applicant_flow',
          '',
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
        id: documentData.id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setUpdateStatusFlow(!updateStatusFlow)

      // Notify requester and follower
      void handleNotify(items[foundIndex], 'Verified By HR')

      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleVerifiedAO = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      status: 'Verified By AO'
    }
    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError(
          'Verified By AO',
          'hrm_ranking_applicants',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Status flow
      const { error: error2 } = await supabase
        .from('hrm_ranking_applicant_flow')
        .insert({
          applicant_id: documentData.id,
          user_id: user.id,
          receiver_id: user.id,
          status: 'Verified By AO'
        })

      if (error2) {
        void logError(
          'Forwarded Request Flow',
          'hrm_ranking_applicant_flow',
          '',
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
        id: documentData.id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setUpdateStatusFlow(!updateStatusFlow)

      // Notify requester and follower
      void handleNotify(items[foundIndex], 'Verified By AO')

      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConfirmedForward = async () => {
    if (!selectedUser) return

    if (saving) return

    setSaving(true)

    const newData = {
      current_approver_id: selectedUser.id
    }
    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError(
          'Forward',
          'hrm_ranking_applicants',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Status flow
      const { error: error2 } = await supabase
        .from('hrm_ranking_applicant_flow')
        .insert({
          applicant_id: documentData.id,
          user_id: user.id,
          receiver_id: selectedUser.id,
          status: 'Forwarded'
        })

      if (error2) {
        void logError(
          'Forward Request Flow',
          'hrm_tracker_flow',
          '',
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
        id: documentData.id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // Notify requester and receiver
      void handleNotify(items[foundIndex], 'Forwarded')

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setSelectedUser(selectedUsers[0])
    } else {
      setSelectedUser(null)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideModal()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef])

  return (
    <div ref={wrapperRef} className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text flex-1">
              Reclassification Application
            </h5>
            <div className="flex space-x-4 items-center justify-end">
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>
          </div>
          <div className="flex space-x-2 items-center justify-between border-b p-4 bg-orange-50">
            <div className="w-full">
              {/* Verify button */}
              {documentData.current_approver_id === session?.user.id && (
                <div className="mb-6">
                  <div className="space-x-2">
                    {documentData.status === 'For AO Verification' && (
                      <CustomButton
                        containerStyles="app__btn_green"
                        title={saving ? 'Saving...' : 'Mark as Verified By AO'}
                        btnType="button"
                        handleClick={() => HandleConfirm('Verified By AO')}
                      />
                    )}
                    {documentData.status === 'Verified By AO' && (
                      <CustomButton
                        containerStyles="app__btn_green"
                        title={saving ? 'Saving...' : 'Mark as Verified By HR'}
                        btnType="button"
                        handleClick={() => HandleConfirm('Verified By HR')}
                      />
                    )}
                    {documentData.status !== 'Verified By AO' &&
                      documentData.status !== 'Verified By HR' && (
                        <>
                          <CustomButton
                            containerStyles="app__btn_red"
                            title={
                              saving ? 'Saving...' : 'Mark as Not Qualified'
                            }
                            btnType="button"
                            handleClick={() => HandleConfirm('Not Qualified')}
                          />
                          <div className="text-[10px] mt-1 text-gray-600">
                            By clicking verifiy, you acknowledge that all
                            information is accurate and cannot be modified after
                            submission.
                          </div>
                        </>
                      )}
                  </div>
                </div>
              )}

              {/* Forward */}
              {documentData.current_approver_id === session?.user.id && (
                <div className="">
                  <div className="font-medium text-sm text-gray-700">
                    Forward this to:
                  </div>
                  <div className="flex w-full space-x-2">
                    <SearchUserInput
                      isMultiple={false}
                      excludedIds={session ? [session.user.id] : []}
                      classNames="w-1/2"
                      handleSelectedUsers={handleSelectedUsers}
                    />
                    <CustomButton
                      containerStyles="app__btn_green"
                      title={saving ? 'Saving...' : 'Forward'}
                      btnType="button"
                      handleClick={() => HandleConfirm('Forward')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-body relative overflow-x-scroll">
            {/* Document Details */}
            <div className="py-2">
              <div className="flex flex-col lg:flex-row w-full items-start justify-between space-x-2 text-xs dark:text-gray-400">
                {/* First Column */}
                <div className="px-4 w-full">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-40"></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 py-2 font-light text-right">
                          Current Status:
                        </td>
                        <td>
                          {documentData.status === 'For AO Verification' && (
                            <span className="app__status_orange">
                              {documentData.status}
                            </span>
                          )}
                          {documentData.status === 'Verified By AO' && (
                            <span className="app__status_green">
                              {documentData.status}
                            </span>
                          )}
                          {documentData.status === 'Verified By HR' && (
                            <span className="app__status_green">
                              {documentData.status}
                            </span>
                          )}
                          {documentData.status === 'Not Qualified' && (
                            <span className="app__status_red">
                              {documentData.status}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 font-light text-right">
                          Reference Code:
                        </td>
                        <td>
                          <span className="font-medium text-sm">
                            {documentData.code}
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td className="px-2 font-light text-right align-top">
                          Requester:
                        </td>
                        <td className="font-medium align-top">
                          <div className="text-gray-500 text-[10px]">
                            {format(
                              new Date(documentData.created_at),
                              'dd MMM yyyy h:mm a'
                            )}
                          </div>
                          <Link
                            target="_blank"
                            href={`/profile/${documentData.employee.id}`}
                          >
                            <UserBlock user={documentData.employee} />
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 font-light text-right">
                          Item No:
                        </td>
                        <td>
                          <span className="font-medium text-sm">
                            {documentData.employee?.hrm_item?.item_number}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Second Column */}
                <div className="px-2 w-full">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-40"></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={2}>
                          <div className="mt-4">
                            <div className="text-center">EQUIVALENT UNITS</div>
                            <div className="mt-2">
                              <EquivalentUnits documentData={documentData} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <hr />
            <div className="py-2 md:flex">
              <div className="md:w-1/2">
                <div className="mx-2 mt-4 px-4 py-4 text-gray-600 bg-gray-100">
                  <div className="mb-6 px-4">
                    <span className="font-bold text-xs">Tracker:</span>
                  </div>
                  <StatusFlow
                    updateStatusFlow={updateStatusFlow}
                    documentId={documentData.id.toString()}
                  />
                </div>
              </div>
              <div className="flex-1">
                <Remarks document={documentData} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Action Confirmation Modal */}
      {showConfirmModal !== '' && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message={confirmMessage}
          onConfirm={HandleOnConfirm}
          onCancel={handleOnCancel}
        />
      )}
    </div>
  )
}
