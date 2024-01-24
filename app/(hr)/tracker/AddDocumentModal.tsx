'use client'
import React, { useState, useRef, useEffect } from 'react'
import { CustomButton } from '@/components'
import { requestTypes } from '@/constants'
import LeaveForm from './LeaveForm'
import TravelForm from './TravelForm'
import PassSlipForm from './PassSlipForm'

interface ModalProps {
  hideModal: () => void
}

export default function AddDocumentModal ({ hideModal }: ModalProps) {
  const [requestType, setRequestType] = useState('')

  const wrapperRef = useRef<HTMLDivElement>(null)

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
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Request Details
              </h5>
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
            </div>
            <div className='app__modal_body'>
              <div className='w-full lg:w-1/2 px-4'>
                <div className='grid grid-cols-1 gap-4 mb-4'>
                  <div className='w-full'>
                    <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Request Type:</div>
                    <div>
                      <select
                        value={requestType}
                        onChange={e => setRequestType(e.target.value)}
                        className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                        <option value=''>Select Request Type</option>
                        {
                          requestTypes?.map((item, index) => (
                            <option key={index} value={item}>{item}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <hr className='my-6 mx-4'/>
              {
                requestType === 'Leave' &&
                  <LeaveForm hideModal={hideModal}/>
              }
              {
                requestType === 'Travel' &&
                  <TravelForm hideModal={hideModal}/>
              }
              {
                requestType === 'Pass Slip' &&
                  <PassSlipForm hideModal={hideModal}/>
              }
            </div>
          </div>
        </div>
      </div>
  )
}
