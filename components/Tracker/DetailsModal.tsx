/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import { format } from 'date-fns'
import Remarks from './Remarks/Remarks'
import { useSupabase } from '@/context/SupabaseProvider'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PaperClipIcon } from '@heroicons/react/24/solid'
import { type FileWithPath, useDropzone } from 'react-dropzone'

import type { DocumentTypes, AttachmentTypes, FollowersTypes, Employee, namesType } from '@/types'
import { ConfirmModal, CustomButton, SearchUserInput, StatusFlow, UserBlock } from '@/components'
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { recount } from '@/GlobalRedux/Features/recountSlice'
import { useFilter } from '@/context/FilterContext'
import { BellAlertIcon, BellSlashIcon, StarIcon, XMarkIcon } from '@heroicons/react/20/solid'
import AddStickyModal from './AddStickyModal'
import { logError } from '@/utils/fetchApi'
import { Tooltip } from 'react-tooltip'

interface ModalProps {
  hideModal: () => void
  documentData: DocumentTypes
}

function Attachment ({ id, file }: { id: string, file: string }) {
  const [downloading, setDownloading] = useState(false)

  const { supabase } = useSupabase()

  const handleDownloadFile = async (file: string) => {
    if (downloading) return

    setDownloading(true)

    const { data, error } = await supabase
      .storage
      .from('hrm_documents')
      .download(`requests/${id}/${file}`)

    if (error) console.error(error)

    const url = window.URL.createObjectURL(new Blob([data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file)
    document.body.appendChild(link)
    link.click()
    link.remove()

    setDownloading(false)
  }

  return (
    <div
      onClick={() => handleDownloadFile(file)}
      className={`flex space-x-2 items-center ${downloading ? '' : 'cursor-pointer'}`}>
      <PaperClipIcon
        className='w-4 h-4 text-blue-700 '/>
      <span className='text-blue-700 font-medium text-[10px]'>
        {file}
        {downloading ? ' downloading...' : ''}
      </span>
    </div>
  )
}

export default function DetailsModal ({ hideModal, documentData: originalData }: ModalProps) {
  const [documentData, setDocumentData] = useState<DocumentTypes>(originalData)
  const [attachments, setAttachments] = useState<AttachmentTypes[] | []>([])
  const [loadingReplies, setLoadingReplies] = useState(false)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [updateStatusFlow, setUpdateStatusFlow] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)
  const [showAddStickyModal, setShowAddStickyModal] = useState(false)
  const [hideStickyButton, setHideStickyButton] = useState(false)
  const [hideFollowButton, setHideFollowButton] = useState(false)

  const [showConfirmForwardModal, setShowConfirmForwardModal] = useState(false)
  const [showConfirmApproveModal, setShowConfirmApproveModal] = useState(false)
  const [showConfirmDisapproveModal, setShowConfirmDisapproveModal] = useState(false)

  // Forward to this user
  const [selectedUser, setSelectedUser] = useState<namesType | null>(null)

  const [selectedImages, setSelectedImages] = useState<any>([])
  const { systemUsers, session, supabase } = useSupabase()

  const { setToast } = useFilter()

  const wrapperRef = useRef<HTMLDivElement>(null)

  const user: Employee = systemUsers.find((user: Employee) => user.id === session.user.id)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const handleFollow = async () => {
    try {
      const { error } = await supabase
        .from('hrm_tracker_followers')
        .insert({
          tracker_id: documentData.id,
          user_id: user.id
        })
      if (error) throw new Error(error.message)

      setToast('success', 'Successfully Followed.')
      setHideFollowButton(true)

      dispatch(recount())
    } catch (e) {
      console.error(e)
    }
  }

  const handleUnfollow = async () => {
    try {
      const { error } = await supabase
        .from('hrm_tracker_followers')
        .delete()
        .eq('tracker_id', documentData.id)
        .eq('user_id', user.id)

      if (error) throw new Error(error.message)

      setToast('success', 'Successfully Unfollowed.')
      setHideFollowButton(false)

      dispatch(recount())
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotify = async (document: DocumentTypes, actionType: string) => {
    //
    try {
      const userIds: string[] = []

      // Followers
      const { data: followers } = await supabase
        .from('hrm_tracker_followers')
        .select('user_id')
        .eq('tracker_id', document.id)

      followers.forEach((user: FollowersTypes) => {
        userIds.push(user.user_id.toString())
      })

      // Notify the origin
      userIds.push(document.created_by)

      // Notify the receiver if status is forwarded
      if (actionType === 'Forwarded') {
        userIds.push(document.receiver_id)
      }

      // Remove the duplicated IDs
      const uniqueIds = userIds.reduce((accumulator: string[], currentValue: string) => {
        if (!accumulator.includes(currentValue)) {
          accumulator.push(currentValue)
        }
        return accumulator
      }, [])

      const notificationData: any[] = []

      uniqueIds.forEach((userId) => {
        notificationData.push({
          message: `The request ${document.reference_code} has been ${actionType}.`,
          url: `/tracker/${document.reference_code}`,
          type: actionType,
          user_id: userId,
          reference_id: document.id,
          reference_table: 'hrm_request_trackers'
        })
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

  const handleForward = () => {
    if (!selectedUser) return
    setShowConfirmForwardModal(true)
  }

  const handleApprove = () => {
    setShowConfirmApproveModal(true)
  }

  const handleDisapprove = () => {
    setShowConfirmDisapproveModal(true)
  }

  const handleConfirmedForward = async () => {
    if (!selectedUser) return

    if (saving) return

    setSaving(true)

    const newData = {
      current_tracker: 'Forwarded',
      receiver_id: selectedUser.id
    }
    try {
      const { error } = await supabase
        .from('hrm_request_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError('Forward Request', 'hrm_request_trackers', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      const { error: error2 } = await supabase
        .from('hrm_tracker_flow')
        .insert({
          tracker_id: documentData.id,
          user_id: user.id,
          receiver_id: selectedUser.id,
          status: 'Forwarded'
        })

      if (error2) {
        void logError('Forward Request Flow', 'hrm_tracker_flow', '', error2.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error2.message)
      }

      // Update data in redux
      const items: DocumentTypes[] = [...globallist]
      const updatedData = { ...newData, id: documentData.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))
      setDocumentData(items[foundIndex]) // update ui with new data

      // Notify requester and receiver
      void handleNotify(items[foundIndex], 'Forwarded')

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      setShowConfirmForwardModal(false)

      // Recount sidebar counter
      dispatch(recount())

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConfirmedApprove = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      current_status: 'Approval Recommended',
      current_approver_id: session.user.id
    }
    try {
      const { error } = await supabase
        .from('hrm_request_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError('Approval Recommended', 'hrm_request_trackers', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // Added log to latest tracker flow
      const { data } = await supabase
        .from('hrm_tracker_flow')
        .select()
        .eq('tracker_id', documentData.id)
        .order('id', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        const newData = {
          message: 'Approval Recommended',
          tracker_flow_id: data.id,
          user_id: session.user.id
        }

        const { error: error2 } = await supabase
          .from('hrm_tracker_logs')
          .insert(newData)
          .eq('id', documentData.id)

        if (error2) {
          void logError('Approval Recommended Flow Logs', 'hrm_tracker_flow', '', error2.message)
        }
      }

      // Update data in redux
      const items: DocumentTypes[] = [...globallist]
      const updatedData = { ...newData, id: documentData.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))
      setDocumentData(items[foundIndex]) // update ui with new data

      // Notify requester and follower
      void handleNotify(items[foundIndex], 'Approval Recommended')

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      setShowConfirmApproveModal(false)

      // Recount sidebar counter
      dispatch(recount())

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConfirmedDisapprove = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      current_status: 'Disapproved',
      current_approver_id: session.user.id
    }
    try {
      const { error } = await supabase
        .from('hrm_request_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError('Disapproved', 'hrm_request_trackers', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      const { error: error2 } = await supabase
        .from('hrm_tracker_flow')
        .insert({
          tracker_id: documentData.id,
          user_id: session.user.id,
          status: 'Disapproved'
        })

      if (error2) {
        void logError('Disapproved', 'hrm_tracker_flow', '', error2.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error2.message)
      }

      // Update data in redux
      const items: DocumentTypes[] = [...globallist]
      const updatedData = { ...newData, id: documentData.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))
      setDocumentData(items[foundIndex]) // update ui with new data

      // Notify requester and follower
      void handleNotify(items[foundIndex], 'Disapproved')

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      setShowConfirmDisapproveModal(false)

      // Recount sidebar counter
      dispatch(recount())

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAttachments = async () => {
    setLoadingReplies(true)

    const { data, error }: { data: AttachmentTypes[] | [], error: unknown } = await supabase
      .storage
      .from('hrm_documents')
      .list(`requests/${documentData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)
    setLoadingReplies(false)

    setAttachments(data)
  }

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImages(acceptedFiles.map(file => (
      Object.assign(file, {
        filename: file.name
      })
    )))
  }, [])

  const maxSize = 5242880 // 5 MB in bytes
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.docx'],
      'application/vnd.ms-excel': ['.xlsx']
    },
    maxSize
  })

  const handleUploadFiles = async () => {
    const id = documentData.id.toString()
    const newAttachments: any = []

    setUploading(true)

    // Upload attachments
    await Promise.all(
      selectedImages.map(async (file: { name: string }) => {
        const { error } = await supabase.storage
          .from('hrm_documents')
          .upload(`requests/${id}/${file.name}`, file)

        if (error) {
          console.log(error)
        } else {
          newAttachments.push({ name: file.name })
        }
      })
    )

    setSelectedImages([])
    setUploading(false)
    setToast('success', 'Successfully uploaded.')

    setAttachments([...attachments, ...newAttachments])
  }

  const deleteFile = (file: FileWithPath) => {
    const files = selectedImages.filter((f: FileWithPath) => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: any, index: number) => (
    <div key={index} className="flex space-x-1 py-px items-center justify-start relative align-top">
      <XMarkIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-red-400'/>
      <span className='text-xs'>{file.filename}</span>
    </div>
  ))

  const handleAddToStickies = async (item: DocumentTypes) => {
    setShowAddStickyModal(true)
    setSelectedItem(item)
  }

  const handleSelectedUsers = (selectedUsers: namesType[]) => {
    if (selectedUsers.length > 0) {
      setSelectedUser(selectedUsers[0])
    } else {
      setSelectedUser(null)
    }
  }

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([])
    }
  }, [fileRejections])

  useEffect(() => {
    void fetchAttachments()
  }, [])

  useEffect(() => {
    const checkedFollowStatus = async () => {
      const { count }: { count: number } = await supabase
        .from('hrm_tracker_followers')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('tracker_id', documentData.id)

      if (count > 0) {
        setHideFollowButton(true)
      }
    }

    const checkedIfStickyStatus = async () => {
      const { count }: { count: number } = await supabase
        .from('hrm_request_tracker_stickies')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('tracker_id', documentData.id)

      if (count > 0) {
        setHideStickyButton(true)
      }
    }

    void checkedFollowStatus()
    void checkedIfStickyStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
              <h5 className="app__modal_header_text flex-1">Request Details</h5>
              <div className='flex space-x-4 items-center justify-end'>
                {
                  !hideStickyButton &&
                    <>
                      <StarIcon onClick={() => handleAddToStickies(documentData)} className='cursor-pointer outline-none w-6 h-6 text-yellow-500' data-tooltip-id="add-sticky-tooltip" data-tooltip-content="Add to Stickies"/>
                      <Tooltip id="add-sticky-tooltip" place='bottom-end'/>
                    </>
                }
                {
                  !hideFollowButton
                    ? <>
                        <BellSlashIcon onClick={handleFollow} className='w-6 h-6 text-blue-700 cursor-pointer outline-none' data-tooltip-id="follow-tooltip" data-tooltip-content="Follow/Unfollow"/>
                        <Tooltip id="follow-tooltip" place='bottom-end'/>
                      </>
                    : <>
                        <BellAlertIcon onClick={handleUnfollow} className='w-6 h-6 text-blue-700 cursor-pointer outline-none' data-tooltip-id="follow-tooltip" data-tooltip-content="Follow/Unfollow"/>
                        <Tooltip id="follow-tooltip" place='bottom-end'/>
                      </>
                }
                <CustomButton
                  containerStyles='app__btn_gray'
                  title='Close'
                  btnType='button'
                  handleClick={hideModal}
                />
              </div>
            </div>
            <div className="flex space-x-2 items-center justify-between border-b p-4 bg-orange-50">
              {/* Approval and Forwarding */}
              <div className='w-full'>
                {
                  (documentData.current_approver_id !== session.user.id && documentData.receiver_id === session.user.id) &&
                    <div className='mb-6'>
                      <div className='space-x-2'>
                        <CustomButton
                          containerStyles='app__btn_green'
                          title={saving ? 'Saving...' : 'Approval Recommended'}
                          btnType='button'
                          handleClick={handleApprove}
                        />
                        <CustomButton
                          containerStyles='app__btn_red'
                          title={saving ? 'Saving...' : 'Disapprove'}
                          btnType='button'
                          handleClick={handleDisapprove}
                        />
                      </div>
                      <div className='text-[10px] mt-1 text-gray-600'>By clicking &apos;Approve&apos;, you are authorizing and granting permission to the requester to proceed with the specified request.</div>
                    </div>
                }
                {
                  ((documentData.current_status === 'Request Created' && documentData.created_by === session.user.id) ||
                    (['Forwarded', 'Approval Recommended'].includes(documentData.current_status) && documentData.receiver_id === session.user.id)
                  ) &&
                    <div className="">
                      <div className='font-medium text-sm text-gray-700'>Forward this request to:</div>
                      <div className="flex w-full space-x-2">
                        <SearchUserInput
                          isMultiple={false}
                          classNames='w-1/2'
                          handleSelectedUsers={handleSelectedUsers}/>
                        <CustomButton
                          containerStyles='app__btn_green'
                          title={saving ? 'Saving...' : 'Forward'}
                          btnType='button'
                          handleClick={handleForward}
                        />
                      </div>
                    </div>
                }
              </div>
            </div>
            <div className="modal-body relative overflow-x-scroll">
              {/* Document Details */}
              <div className='py-2'>
                <div className='flex flex-col lg:flex-row w-full items-start justify-between space-x-2 text-xs dark:text-gray-400'>
                  {/* First Column */}
                  <div className='px-4 w-full'>
                    <table className='w-full'>
                      <thead><tr><th className='w-40'></th><th></th></tr></thead>
                      <tbody>
                        <tr>
                          <td className='px-2 py-2 font-light text-right'>Reference Code:</td>
                          <td>
                            <span className='font-medium text-sm'>{documentData.reference_code}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-light text-right'>Current Status:</td>
                          <td>
                            {documentData.current_status === 'Request Created' && <span className='text-red-700 px-1 bg-red-100 border border-red-500 font-medium text-sm'>{documentData.current_status}</span>}
                            {documentData.current_status === 'Approval Recommended' && <span className='text-orange-700 px-1 bg-orange-100 border border-orange-500 font-medium text-sm'>{documentData.current_status}</span>}
                            {documentData.current_status === 'Approved' && <span className='text-green-700 px-1 bg-green-100 border border-green-500 font-medium text-sm'>{documentData.current_status}</span>}
                            {documentData.current_status === 'Disapproved' && <span className='text-red-700 px-1 bg-red-100 border border-red-500 font-medium text-sm'>{documentData.current_status}</span>}
                          </td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-light text-right'>Request Type:</td>
                          <td className='text-sm font-medium'>{documentData.type}</td>
                        </tr>
                        {/* Leave Requests Fields */}
                        {
                          documentData.type === 'Leave' &&
                            <>
                              <tr>
                                <td className='px-2 py-2 font-light text-right'>Leave Type:</td>
                                <td className='text-sm font-medium'>{documentData.leave_type}</td>
                              </tr>
                              {
                                (documentData.leave_days && documentData.leave_to && documentData.leave_days.trim() !== '' && documentData.leave_to.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Number of working days applied for:</td>
                                    <td className='text-sm font-medium'>{documentData.leave_days}</td>
                                  </tr>
                              }
                              {
                                (documentData.leave_from && documentData.leave_to && documentData.leave_from.trim() !== '' && documentData.leave_to.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Inclusive Dates:</td>
                                    <td className='text-sm font-medium'>{format(new Date(documentData.leave_from), 'MMMM dd, yyyy')} to {format(new Date(documentData.leave_to), 'MMMM dd, yyyy')}</td>
                                  </tr>
                              }
                              {
                                (documentData.leave_location && documentData.leave_location.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Location:</td>
                                    <td className='text-sm font-medium'>{documentData.leave_location} {documentData.leave_specify_location}</td>
                                  </tr>
                              }
                              {
                                (documentData.leave_hospitalization && documentData.leave_hospitalization.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Hospitalization:</td>
                                    <td className='text-sm font-medium'>{documentData.leave_hospitalization} - {documentData.leave_illness}</td>
                                  </tr>
                              }
                              {
                                (documentData.leave_women_illness && documentData.leave_women_illness.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Illness:</td>
                                    <td className='text-sm font-medium'>{documentData.leave_women_illness}</td>
                                  </tr>
                              }
                              {
                                (documentData.leave_study_purpose && documentData.leave_study_purpose.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Study Purpose:</td>
                                    <td className='text-sm font-medium'>{documentData.leave_study_purpose}</td>
                                  </tr>
                              }
                              {
                                (documentData.leave_other_purpose && documentData.leave_other_purpose.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Other Purpose:</td>
                                    <td className='text-sm font-medium'>{documentData.leave_other_purpose}</td>
                                  </tr>
                              }
                              {
                                (documentData.leave_commutation && documentData.leave_commutation.trim() !== '') &&
                                  <tr>
                                    <td className='px-2 py-2 font-light text-right'>Commutation:</td>
                                    <td className='text-sm font-medium'>{documentData.leave_commutation}</td>
                                  </tr>
                              }
                            </>
                        }
                        {/* End - Leave Requests Fields */}
                      </tbody>
                    </table>
                  </div>
                  {/* Second Column */}
                  <div className='px-2 w-full'>
                    <table className='w-full'>
                      <thead><tr><th className='w-40'></th><th></th></tr></thead>
                      <tbody>
                        <tr>
                          <td className='px-2 font-light text-right align-top'>Requester:</td>
                          <td className='font-medium align-top'>
                            <div className='text-gray-500 text-[10px]'>{format(new Date(documentData.created_at), 'dd MMM yyyy h:mm a')}</div>
                            <UserBlock user={documentData.creator}/>
                          </td>
                        </tr>
                        <tr>
                          <td className='px-2 pt-2 font-light text-right align-top'>Attachments:</td>
                          <td className='pt-2'>
                            <div>
                              {
                                attachments?.length === 0 && <span>No attachments</span>
                              }
                            {
                              attachments?.map((file, index) => (
                                <div key={index} className='flex items-center space-x-2 justify-start'>
                                  <Attachment file={file.name} id={documentData.id} />
                                </div>
                              ))
                            }
                            </div>
                            <div className="hidden flex-auto overflow-y-auto relative mt-4">
                              <div className='grid grid-cols-1 gap-4'>
                                <div className='w-full'>
                                  <div {...getRootProps()} className='cursor-pointer border-dashed border-2 bg-gray-100 text-gray-600 px-4 py-10'>
                                    <input {...getInputProps()} />
                                    <p className='text-xs'>Drag and drop some files here, or click to select files</p>
                                  </div>
                                  {
                                    (fileRejections.length === 0 && selectedImages.length > 0) &&
                                      <div className='py-4'>
                                        <div className='text-xs font-medium mb-2'>Files to upload:</div>
                                        {selectedFiles}
                                      </div>
                                  }
                                  {
                                    fileRejections.length > 0 &&
                                      <div className='py-4'>
                                          <p className='text-red-500 text-xs'>
                                            File rejected. Please make sure its an image, PDF, DOC, or Excel file and less than 5MB.
                                          </p>
                                      </div>
                                  }
                                </div>
                              </div>
                              {
                                (selectedFiles.length > 0 && fileRejections.length === 0) &&
                                  <CustomButton
                                    containerStyles='app__btn_green'
                                    title={uploading ? 'Uploading...' : 'Upload'}
                                    btnType='button'
                                    handleClick={handleUploadFiles}
                                  />
                              }
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <hr/>
              <div className='py-2 md:flex'>
                <div className='md:w-1/2'>
                  <div className='mx-2 mt-4 px-4 py-4 text-gray-600 bg-gray-100'>
                    <div className='mb-6 px-4'>
                      <span className='font-bold text-xs'>Tracker:</span>
                    </div>
                    <StatusFlow updateStatusFlow={updateStatusFlow} documentId={documentData.id.toString()}/>
                  </div>
                </div>
                <div className='flex-1'>
                  {
                    loadingReplies
                      ? <TwoColTableLoading/>
                      : <Remarks
                          document={documentData}/>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
        {/* Forward Confirmation Modal */}
        {
          showConfirmForwardModal && (
            <ConfirmModal
              header='Forward Confirmation'
              btnText='Confirm'
              message="Are you sure you want to forward this request?"
              onConfirm={handleConfirmedForward}
              onCancel={() => setShowConfirmForwardModal(false)}
            />
          )
        }
        {/* Approve Confirmation Modal */}
        {
          showConfirmApproveModal && (
            <ConfirmModal
              header='Approval Confirmation'
              btnText='Confirm'
              message="Are you sure you want to approve this request?"
              onConfirm={handleConfirmedApprove}
              onCancel={() => setShowConfirmApproveModal(false)}
            />
          )
        }
        {/* Disapprove Confirmation Modal */}
        {
          showConfirmDisapproveModal && (
            <ConfirmModal
              header='Disapproval Confirmation'
              btnText='Confirm'
              message="Are you sure you want to disapprove this request?"
              onConfirm={handleConfirmedDisapprove}
              onCancel={() => setShowConfirmDisapproveModal(false)}
            />
          )
        }
        {/* Add to Sticky Modal */}
        {
            showAddStickyModal && (
              <AddStickyModal
                item={selectedItem}
                hideAddStickButton={() => setHideStickyButton(true)}
                hideModal={() => setShowAddStickyModal(false)}/>
            )
          }
      </div>
  )
}
