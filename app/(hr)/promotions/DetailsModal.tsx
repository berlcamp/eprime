'use client'
import GlobalRemarks from '@/components/GlobalRemarks/GlobalRemarks'
import { ConfirmModal, CustomButton, UserBlock } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import type { PromotionTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uuid from 'react-uuid'

interface ModalProps {
  hideModal: () => void
  promotionData: PromotionTypes
}

interface Attachment {
  name: string
  [key: string]: any // For other possible metadata like lastModified, size, etc.
}

export default function DetailsModal({ promotionData, hideModal }: ModalProps) {
  const { supabase } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const [confirmModal, setConfirmModal] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')

  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const handleDownloadFile = async (file: string) => {
    const { data, error } = await supabase.storage
      .from('hrm')
      .download(`promotions/${promotionData.id}/${file}`)

    if (error || !data) {
      console.error('Download error:', error)
      return
    }

    const url = window.URL.createObjectURL(data) // `data` is already Blob
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url) // cleanup
  }

  const fetchAttachments = async () => {
    const { data, error } = await supabase.storage
      .from('hrm')
      .list(`promotions/${promotionData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('List error:', error)
      return
    }

    setAttachments(data ?? [])
  }

  // display confirm modal
  const HandleConfirm = (action: string) => {
    setConfirmModal(action)
    if (action === 'Recommend Approval') {
      setConfirmMessage('Are you sure you want to recommend this for approval?')
    }
    if (action === 'Approve') {
      setConfirmMessage('Are you sure you want to Approve this?')
    }
    if (action === 'Return to HR for Reverification') {
      setConfirmMessage(
        'Are you sure you want to Return this to HR for Reverification?'
      )
    }
    if (action === 'Disapprove') {
      setConfirmMessage('Are you sure you want to Disapprove this?')
    }
  }

  // based from confirm modal
  const HandleOnConfirm = () => {
    if (confirmModal === 'Recommend Approval') {
      void handleRecommendApproval()
    }
    if (confirmModal === 'Approve') {
      void handleApprove()
    }
    if (confirmModal === 'Return to HR for Reverification') {
      void handleReverification()
    }
    if (confirmModal === 'Disapprove') {
      void handleDisapprove()
    }
    setConfirmModal('')
    setConfirmMessage('')
  }

  // based from confirm modal
  const handleCancel = () => {
    // hide the modal
    setConfirmModal('')
    setConfirmMessage('')
  }

  const handleRecommendApproval = async () => {
    try {
      const newData = {
        status: 'For Final Approval'
      }
      const { error } = await supabase
        .from('hrm_promotions')
        .update(newData)
        .eq('id', promotionData.id)

      if (error) {
        void logError(
          'Promotion - final approval',
          'hrm_promotions',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: promotionData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleApprove = async () => {
    try {
      const newData = {
        status: 'Approved'
      }
      const { error } = await supabase
        .from('hrm_promotions')
        .update(newData)
        .eq('id', promotionData.id)

      if (error) {
        void logError(
          'Promotion - final approval',
          'hrm_promotions',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: promotionData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReverification = async () => {
    try {
      const newData = {
        status: 'For Verification'
      }
      const { error } = await supabase
        .from('hrm_promotions')
        .update(newData)
        .eq('id', promotionData.id)

      if (error) {
        void logError(
          'Promotion - For Verification',
          'hrm_promotions',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: promotionData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDisapprove = async () => {
    try {
      const newData = {
        status: 'Disapproved'
      }
      const { error } = await supabase
        .from('hrm_promotions')
        .update(newData)
        .eq('id', promotionData.id)

      if (error) {
        void logError(
          'Promotion - Disapproved',
          'hrm_promotions',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: promotionData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    void fetchAttachments()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Promotion Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>
            {hasAccess('verify_promotions') &&
              promotionData.status === 'For Verification' && (
                <div className="flex space-x-2 items-center justify-between border-b p-4 bg-orange-50">
                  <div className="w-full">
                    <CustomButton
                      containerStyles="app__btn_green"
                      title="Recommend Approval"
                      btnType="button"
                      handleClick={() => HandleConfirm('Recommend Approval')}
                    />
                    <div className="text-[10px] mt-1 text-gray-600">
                      By clicking &apos;Recommend Approval&apos;, this promotion
                      request will be forwarded to SDS for final approval.
                    </div>
                  </div>
                </div>
              )}
            {hasAccess('sds') &&
              promotionData.status === 'For Final Approval' && (
                <div className="flex space-x-2 items-center justify-between border-b p-4 bg-orange-50">
                  <div className="w-full">
                    <div className="flex space-x-4">
                      <CustomButton
                        containerStyles="app__btn_green"
                        title="Approve"
                        btnType="button"
                        handleClick={() => HandleConfirm('Approve')}
                      />
                      <CustomButton
                        containerStyles="app__btn_orange"
                        title="Return to HR for Reverification"
                        btnType="button"
                        handleClick={() =>
                          HandleConfirm('Return to HR for Reverification')
                        }
                      />
                      <CustomButton
                        containerStyles="app__btn_red"
                        title="Disapprove"
                        btnType="button"
                        handleClick={() => HandleConfirm('Disapprove')}
                      />
                    </div>
                    <div className="text-[10px] mt-1 text-gray-600">
                      By clicking &apos;Approve&apos;, this promotion will be
                      approve and NOSI/NOSA will automatically be created on
                      effectivity date.
                    </div>
                  </div>
                </div>
              )}
            <div className="app__modal_body">
              <div className="flex flex-col lg:flex-row w-full items-start justify-between space-x-2 text-xs dark:text-gray-400">
                {/* First Column */}
                <div className="px-4 w-full">
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Employee:</div>
                      <div className="app__label_value">
                        <UserBlock user={promotionData.hrm_user} />
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">New Position:</div>
                      <div className="app__label_value">
                        {promotionData.hrm_item.hrm_position?.name}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Effectivity Date:
                      </div>
                      <div className="app__label_value">
                        <span>
                          {format(
                            new Date(promotionData.effectivity_date),
                            'MMMM dd, yyyy'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Status:</div>
                      <div className="app__label_value">
                        {promotionData.status === 'Approved' && (
                          <span className="app__status_container_green">
                            Approved
                          </span>
                        )}
                        {promotionData.status === 'For Verification' && (
                          <span className="app__status_container_orange">
                            For Verification
                          </span>
                        )}
                        {promotionData.status === 'For Final Approval' && (
                          <span className="app__status_container_orange">
                            For Final Approval
                          </span>
                        )}
                        {promotionData.status === 'Disapproved' && (
                          <span className="app__status_container_red">
                            Disapproved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Second Column */}
                <div className="px-4 w-full">
                  <div className="w-full">
                    <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                      Supporting Documents:
                    </div>
                    <div>
                      {attachments?.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          No documents uploaded yet.
                        </div>
                      ) : (
                        <>
                          {attachments?.map((file: { name: string }) => (
                            <div
                              key={uuid()}
                              className="flex items-center space-x-2 justify-start p-1"
                            >
                              <div
                                onClick={async () =>
                                  await handleDownloadFile(file.name)
                                }
                                className="flex space-x-2 items-center cursor-pointer"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4 text-blue-700" />
                                {file.name.length > 11 ? (
                                  <span className="text-blue-500 text-xs">
                                    {file.name.charAt(0)}...
                                    {file.name.slice(-10)}
                                  </span>
                                ) : (
                                  <span className="text-blue-500 text-xs">
                                    {file.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <GlobalRemarks
                  referenceColumn="promotion_id"
                  referenceValue={promotionData.id.toString()}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Action Confirmation Modal */}
        {confirmModal !== '' && (
          <ConfirmModal
            header="Confirmation"
            btnText="Confirm"
            message={confirmMessage}
            onConfirm={HandleOnConfirm}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  )
}
