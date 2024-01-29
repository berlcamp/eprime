'use client'
import React, { useState, useEffect } from 'react'
import uuid from 'react-uuid'
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton, UserBlock } from '@/components'
import type { PromotionTypes } from '@/types'
import { format } from 'date-fns'
import GlobalRemarks from '@/components/GlobalRemarks/GlobalRemarks'

interface ModalProps {
  hideModal: () => void
  promotionData: PromotionTypes
}

export default function DetailsModal ({ promotionData, hideModal }: ModalProps) {
  const { supabase } = useSupabase()

  const [attachments, setAttachments] = useState([])

  const handleDownloadFile = async (file: string) => {
    const { data, error } = await supabase
      .storage
      .from('hrm')
      .download(`promotions/${promotionData.id}/${file}`)

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
      .list(`promotions/${promotionData.id}`, {
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
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Promotion Details
            </h5>
            <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
          </div>

          <div className="app__modal_body">
            <div className='flex flex-col lg:flex-row w-full items-start justify-between space-x-2 text-xs dark:text-gray-400'>
              {/* First Column */}
              <div className='px-4 w-full'>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Employee:</div>
                    <div className='app__label_value'>
                      <UserBlock user={promotionData.hrm_user}/>
                    </div>
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>New Position:</div>
                    <div className='app__label_value'>{promotionData.hrm_position.name}</div>
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Effectivity Date:</div>
                    <div className='app__label_value'><span>{format(new Date(promotionData.effectivity_date), 'MMMM dd, yyyy')}</span></div>
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Status:</div>
                    <div className='app__label_value'>
                      {promotionData.status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                      {promotionData.status === 'For Verification' && <span className='app__status_container_orange'>For Verification</span>}
                      {promotionData.status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
                    </div>
                  </div>
                </div>
              </div>
              {/* Second Column */}
              <div className='px-4 w-full'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Supporting Documents:</div>
                  <div>
                    {
                      attachments?.length === 0
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
            <div>
              <GlobalRemarks referenceColumn='promotion_id' referenceValue={promotionData.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
  )
}
