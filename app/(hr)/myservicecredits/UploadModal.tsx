/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { useFilter } from '@/context/FilterContext'
import { useDropzone } from 'react-dropzone'
import uuid from 'react-uuid'
import { ArrowDownTrayIcon, XCircleIcon } from '@heroicons/react/24/solid'
import ConfirmModal from '@/components/ConfirmModal'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'
import Image from 'next/image'

// types
import type { ServiceCreditUserTypes } from '@/types'

interface ModalProps {
  hideModal: () => void
  editData: ServiceCreditUserTypes | null
}

export default function UploadModal ({ editData, hideModal }: ModalProps) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()

  const [selectedImages, setSelectedImages] = useState([])
  const [selectedFile, setSelectedFile] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [attachments, setAttachments] = useState([])

  const onDrop = useCallback((acceptedFiles: any) => {
    setSelectedImages(acceptedFiles.map((file: any) => (
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const handleUpload = async () => {
    if (!editData) return

    setSaving(true)

    // Upload files
    await handleUploadFiles(editData.id)

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

  const deleteFile = (file: { path: string }) => {
    const files = selectedImages.filter((f: { path: string }) => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: { path: string, preview: string }) => (
    <div key={uuid()} className="inline-flex relative align-top mx-6">
      <XCircleIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-gray-500 absolute top-0 -right-5'/>
      <Image src={file.preview} width={28} height={28} alt=""/>
    </div>
  ))

  const handleDownloadFile = async (file: string) => {
    if (!editData) return

    const { data, error } = await supabase
      .storage
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

    const { error } = await supabase
      .storage
      .from('hrm')
      .remove([`servicecredits/${editData.id}/${selectedFile}`])

    if (error) {
      console.error(error)
    } else {
      const newAttachments = attachments.filter((item: { name: string }) => item.name !== selectedFile)
      setAttachments(newAttachments)
      setToast('success', 'Successfully deleted.')
    }
  }

  const fetchAttachments = async () => {
    if (!editData) return

    const { data, error } = await supabase
      .storage
      .from('hrm')
      .list(`servicecredits/${editData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)

    setAttachments(data)
  }

  useEffect(() => {
    if (editData) void fetchAttachments()
  }, [])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Supporting Documents
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>

          <div className="app__modal_body">
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Documents:</div>
                  <div>
                    {
                      attachments.length === 0
                        ? <div className='text-sm text-gray-500'>No documents uploaded.</div>
                        : <>
                            {
                              attachments?.map((file: { name: string }) => (
                                <div key={uuid()} className='flex items-center space-x-2 justify-start p-1'>
                                  <div
                                    onClick={async () => await handleDownloadFile(file.name)}
                                    className='flex space-x-2 items-center cursor-pointer'>
                                    <ArrowDownTrayIcon
                                      className='w-4 h-4 text-blue-700'/>
                                      {
                                        file.name.length > 11
                                          ? <span className='text-blue-500 text-xs'>{file.name.charAt(0)}...{file.name.slice(-10)}</span>
                                          : <span className='text-blue-500 text-xs'>{file.name}</span>
                                      }
                                  </div>
                                  {
                                    (editData && !editData.is_approved) &&
                                      <span
                                        onClick={() => handleDeleteClick(file.name)}
                                        className='text-red-600 cursor-pointer text-xs font-bold'>
                                        [Delete This File]
                                      </span>
                                  }
                                </div>
                              ))
                            }
                        </>
                    }
                  </div>
                </div>
              </div>
              {
                (editData && !editData.is_approved) &&
                  <>
                    <div className="flex-auto overflow-y-auto relative p-4">
                      <div className='grid grid-cols-1 gap-4 mb-4'>
                        <div className='w-full'>
                          <div {...getRootProps()} className='border border-dashed bg-gray-100 text-gray-600 px-4 py-8'>
                            <input {...getInputProps()} />
                            <p className='text-sm text-gray-500'>Drag and drop some files here, or click to select files</p>
                          </div>
                          <div className='py-4'>
                            {selectedFiles}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="app__modal_footer">
                        <CustomButton
                          btnType='button'
                          isDisabled={saving}
                          handleClick={handleUpload}
                          title={saving ? 'Saving...' : 'Save'}
                          containerStyles="app__btn_green"
                        />
                        <CustomButton
                          btnType='button'
                          isDisabled={saving}
                          handleClick={hideModal}
                          title='Close'
                          containerStyles="app__btn_gray"
                        />
                    </div>
                  </>
              }
            </div>
          </div>
        </div>
      </div>
      {
        showConfirmation && (
          <ConfirmModal
            header='Confirm Delete'
            btnText='Confirm'
            message="Are you sure you want to delete this file?"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )
      }
    </>
  )
}
