/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import ConfirmModal from '@/components/ConfirmModal'
import { CustomButton } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { useCallback, useEffect, useState } from 'react'
import { type FileWithPath, useDropzone } from 'react-dropzone'
import uuid from 'react-uuid'

// types
import type { ServiceCreditUserTypes } from '@/types'
import { XMarkIcon } from '@heroicons/react/20/solid'

interface ModalProps {
  hideModal: () => void
  editData: ServiceCreditUserTypes | null
}

export default function UploadModal({ editData, hideModal }: ModalProps) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()

  const [selectedImages, setSelectedImages] = useState<any>([])
  const [selectedFile, setSelectedFile] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [attachments, setAttachments] = useState([])

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImages(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          filename: file.name
        })
      )
    )
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

  const handleUpload = async () => {
    if (!editData) return

    setSaving(true)

    // Upload files
    await handleUploadFiles(editData.id)

    // Notify approvers
    const fullname = `${editData.hrm_users.firstname} ${editData.hrm_users.middlename} ${editData.hrm_users.lastname}`
    await handleNotify(fullname, editData.service_credit_id)

    // refetch attachments
    void fetchAttachments()

    // reset attachments
    setSelectedImages([])

    // pop up the success message
    setToast('success', 'Successfully saved.')

    setSaving(false)
  }

  const handleUploadFiles = async (id: string) => {
    // Upload attachments
    await Promise.all(
      selectedImages.map(async (file: { name: string }) => {
        const { error } = await supabase.storage
          .from('hrm')
          .upload(`servicecredits/${id}/${file.name}`, file)
        if (error) console.error(error)
      })
    )
  }

  const deleteFile = (file: FileWithPath) => {
    const files = selectedImages.filter(
      (f: FileWithPath) => f.path !== file.path
    )
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: any, index: number) => (
    <div
      key={index}
      className="flex space-x-1 py-px items-center justify-start relative align-top"
    >
      <XMarkIcon
        onClick={() => deleteFile(file)}
        className="cursor-pointer w-5 h-5 text-red-400"
      />
      <span className="text-xs">{file.filename}</span>
    </div>
  ))

  const handleDownloadFile = async (file: string) => {
    if (!editData) return

    const { data, error } = await supabase.storage
      .from('hrm')
      .download(`servicecredits/${editData.id}/${file}`)

    if (error) console.error(error)

    const url = window.URL.createObjectURL(new Blob([data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleConfirm = async () => {
    setShowConfirmation(false)
    await handleDeleteFile()
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  const handleDeleteClick = (file: any) => {
    setSelectedFile(file)
    setShowConfirmation(true)
  }

  const handleDeleteFile = async () => {
    if (!editData) return

    const { error } = await supabase.storage
      .from('hrm')
      .remove([`servicecredits/${editData.id}/${selectedFile}`])

    if (error) {
      console.error(error)
    } else {
      const newAttachments = attachments.filter(
        (item: { name: string }) => item.name !== selectedFile
      )
      setAttachments(newAttachments)
      setToast('success', 'Successfully deleted.')
    }
  }

  const fetchAttachments = async () => {
    if (!editData) return

    const { data, error } = await supabase.storage
      .from('hrm')
      .list(`servicecredits/${editData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)

    setAttachments(data)
  }

  const handleNotify = async (fullname: string, id: string) => {
    //
    try {
      const userIds: string[] = []

      // Approvers
      const { data, error } = await supabase
        .from('hrm_system_access')
        .select('user_id')
        .eq('type', 'cto_sc_approver')

      if (error) {
        throw new Error(error.message)
      }

      data.forEach((item: any) => {
        userIds.push(item.user_id)
      })

      const notificationData: any[] = []

      userIds.forEach((userId) => {
        notificationData.push({
          message: `${fullname} uploaded supporting documents for Service Credit. Kindly review and take action necessarily.`,
          url: `/servicecredits?ref=${id}`,
          type: 'Service Credit Supporting Document',
          user_id: userId,
          service_credit_id: id,
          reference_table: 'hrm_ctos'
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

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileRejections])

  useEffect(() => {
    if (editData) void fetchAttachments()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Supporting Documents</h5>
              <CustomButton
                btnType="button"
                isDisabled={saving}
                handleClick={hideModal}
                title="Close"
                containerStyles="app__btn_gray"
              />
            </div>

            <div className="app__modal_body">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                    Documents:
                  </div>
                  <div>
                    {attachments.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No documents uploaded.
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
                                  {file.name.charAt(0)}...{file.name.slice(-10)}
                                </span>
                              ) : (
                                <span className="text-blue-500 text-xs">
                                  {file.name}
                                </span>
                              )}
                            </div>
                            {editData && !editData.is_approved && (
                              <span
                                onClick={() => handleDeleteClick(file.name)}
                                className="text-red-600 cursor-pointer text-xs font-bold"
                              >
                                [Delete This File]
                              </span>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {editData && !editData.is_approved && (
                <>
                  <div className="flex-auto overflow-y-auto relative p-4">
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="w-full">
                        <div
                          {...getRootProps()}
                          className="border border-dashed bg-gray-100 text-gray-600 px-4 py-8"
                        >
                          <input {...getInputProps()} />
                          <p className="text-sm text-gray-500">
                            Drag and drop some files here, or click to select
                            files
                          </p>
                        </div>
                        {fileRejections.length === 0 &&
                          selectedImages.length > 0 && (
                            <div className="py-4">
                              <div className="text-xs font-medium mb-2">
                                Files to upload:
                              </div>
                              {selectedFiles}
                            </div>
                          )}
                        {fileRejections.length > 0 && (
                          <div className="py-4">
                            <p className="text-red-500 text-xs">
                              File rejected. Please make sure its an image, PDF,
                              DOC, or Excel file and less than 5MB.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__modal_footer">
                    <CustomButton
                      btnType="button"
                      isDisabled={saving}
                      handleClick={handleUpload}
                      title={saving ? 'Saving...' : 'Save'}
                      containerStyles="app__btn_green"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {showConfirmation && (
        <ConfirmModal
          header="Confirm Delete"
          btnText="Confirm"
          message="Are you sure you want to delete this file?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
