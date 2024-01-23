/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useState, useEffect } from 'react'
import uuid from 'react-uuid'
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'

interface ModalProps {
  hideModal: () => void
  id: string
}

export default function AttachmentsModal ({ id, hideModal }: ModalProps) {
  const { supabase } = useSupabase()

  const [attachments, setAttachments] = useState([])

  const handleDownloadFile = async (file: string) => {
    const { data, error } = await supabase
      .storage
      .from('hrm')
      .download(`servicecredits/${id}/${file}`)

    if (error) console.error(error)

    const url = window.URL.createObjectURL(new Blob([data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .storage
      .from('hrm')
      .list(`servicecredits/${id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)

    setAttachments(data)
  }

  useEffect(() => {
    void fetchAttachments()
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
            <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
          </div>

          <div className="app__modal_body">
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Documents:</div>
                  <div>
                    {
                      attachments.length === 0
                        ? <div className='text-sm text-gray-500'>No documents uploaded yet.</div>
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
                                </div>
                              ))
                            }
                        </>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
