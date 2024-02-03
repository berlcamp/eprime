'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { ConfirmModal, CustomButton, Title } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import { useFilter } from '@/context/FilterContext'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { nanoid } from 'nanoid'
import { type FileWithPath, useDropzone } from 'react-dropzone'

export default function Pdf ({ userId }: { userId: string }) {
  const [selectedImages, setSelectedImages] = useState<any>([])
  const [selectedFile, setSelectedFile] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [attachments, setAttachments] = useState([])

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

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

  const handleUpload = async () => {
    setSaving(true)

    // Upload files
    await handleUploadFiles()

    // refetch attachments
    void fetchAttachments()

    // reset attachments
    setSelectedImages([])

    // pop up the success message
    setToast('success', 'Successfully saved.')

    setSaving(false)
  }

  const handleUploadFiles = async () => {
    // Upload attachments
    await Promise.all(
      selectedImages.map(async (file: { name: string }) => {
        const { error } = await supabase.storage
          .from('hrm')
          .upload(`pdf/${userId}/${file.name}`, file)
        if (error) console.error(error)
      })
    )
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

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .storage
      .from('hrm')
      .list(`pdf/${userId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)

    setAttachments(data)
  }

  const handleDownloadFile = async (file: string) => {
    const { data, error } = await supabase
      .storage
      .from('hrm')
      .download(`pdf/${userId}/${file}`)

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
    const { error } = await supabase
      .storage
      .from('hrm')
      .remove([`pdf/${userId}/${selectedFile}`])

    if (error) {
      console.error(error)
    } else {
      const newAttachments = attachments.filter((item: { name: string }) => item.name !== selectedFile)
      setAttachments(newAttachments)
      setToast('success', 'Successfully deleted.')
    }
  }

  useEffect(() => {
    void fetchAttachments()
  }, [])

  return (
    <>
      <div>
        <div className='app__title'>
          <Title title='Position Description Form'/>
        </div>

        {/* Main Content */}
        <div className='w-full mx-4 mt-4'>
          <div>
            {
              attachments.length === 0
                ? <div className='text-sm text-gray-500'>
                    <div className='mb-2 text-xl'>No signed PDF uploaded yet.</div>
                  </div>
                : <>
                    <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Signed PDF:</div>
                    {
                      attachments?.map((file: { name: string }) => (
                        <div key={nanoid()} className='flex items-center space-x-2 justify-start p-1'>
                          <div
                            onClick={async () => await handleDownloadFile(file.name)}
                            className='flex space-x-2 items-center cursor-pointer'>
                            <ArrowDownTrayIcon
                              className='w-4 h-4 text-blue-700'/>
                            <span className='text-blue-500 text-xs'>{file.name}</span>
                          </div>
                          <span
                            onClick={() => handleDeleteClick(file.name)}
                            className='text-red-600 cursor-pointer text-xs font-bold'>
                            [Delete This File]
                          </span>
                        </div>
                      ))
                    }
                  </>
            }
          </div>

          {/* Upload Form */}
          <div className='mt-8'>
            <div className='w-2/3'>
              <div {...getRootProps()} className='border border-dashed bg-gray-100 text-gray-600 px-4 py-8'>
                <input {...getInputProps()} />
                <p className='text-sm text-gray-500'>Drag the scanned copy of your signed Position Description Form (DBM CSC Form No.1) here. Or click to select file.</p>
              </div>
              {
                (fileRejections.length === 0 && selectedImages.length > 0) &&
                  <>
                  <div className='py-4'>
                    <div className='text-xs font-medium mb-2'>Files to upload:</div>
                    {selectedFiles}
                  </div>
                  <div className='py-4'>
                    <CustomButton
                      btnType='button'
                      isDisabled={saving}
                      handleClick={handleUpload}
                      title={saving ? 'Saving...' : 'Upload'}
                      containerStyles="app__btn_green"
                    />
                  </div>
                  </>
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
