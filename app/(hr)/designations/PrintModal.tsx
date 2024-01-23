import React, { useState, useEffect } from 'react'
import { CustomButton } from '@/components'
import { printLetter } from './printLetter'

// Types
import type { DesignationTypes } from '@/types'
import { capitalizeWords } from '@/utils/text-helper'
import { DocumentArrowDownIcon } from '@heroicons/react/20/solid'

interface ModalProps {
  hideModal: () => void
  item: DesignationTypes
}

const PrintModal = ({ item, hideModal }: ModalProps) => {
  const [letterDate, setLetterDate] = useState(new Date().toISOString().substr(0, 10))
  const [letterSubject, setLetterSubject] = useState('')
  const [letterContent, setLetterContent] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [printing, setPrinting] = useState(false)

  const handlePrint = () => {
    if (letterDate === '') {
      setErrorMessage('Letter date is required')
      return
    }

    setErrorMessage('')
    setPrinting(true)

    void printLetter(item, letterDate, letterSubject, letterContent)

    setPrinting(false)
  }

  useEffect(() => {
    let content = ''
    let subject = ''
    if (item.type === 'Function only') {
      subject = 'DESIGNATION ORDER'
      content = 'In the exigency of service, you are hereby designated as ' + item.designation.toUpperCase() + ' effective immediately.'
      content += '\n\nThis shall take effect until revoke by the Superintendent.'
      content += '\n\nPlease be guided accordingly.'
    } else {
      let station = ''
      if (item.area_assigned === 'school') {
        station = item.hrm_schools?.name
      } else {
        station = item.hrm_offices?.name
      }
      subject = item.designation.toUpperCase() + ' DESIGNATION'
      content = 'You are hereby designated as ' + item.designation.toUpperCase() + ' of ' + station.toUpperCase() + ' effective immediately.'
      content += '\nThis shall take effect until revoke by the Superintendent.'
      content += '\nPlease be guided accordingly.'
    }

    setLetterContent(content)
    setLetterSubject(subject)
  }, [])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Letter
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
                <div className='app__label_standard'>To:</div>
                <div className='app__label_value'>
                  <div>{capitalizeWords(item.hrm_users?.firstname + ' ' + item.hrm_users?.middlename + ' ' + item.hrm_users?.lastname)}</div>
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>From:</div>
                <div className='app__label_value'>
                  <div>{capitalizeWords(`${process.env.NEXT_PUBLIC_SDS ?? ''}`)}</div>
                  <div className='font-light'>Schools Division Superintendent</div>
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Date:</div>
                <div>
                  <input
                    onChange={e => setLetterDate(e.target.value)}
                    value={letterDate}
                    type='date'
                    className='app__select_standard'/>
                    {errorMessage && <div className='text-xs text-red-500 mt-2 flex space-x-2'>{errorMessage}</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Subject:</div>
                <div>
                  <input
                    onChange={e => setLetterSubject(e.target.value)}
                    value={letterSubject}
                    type="text"
                    className='app__select_standard'/>
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Content:</div>
                <div>
                  <textarea
                    onChange={e => setLetterContent(e.target.value)}
                    value={letterContent}
                    rows={10}
                    className='app__select_standard'/>
                </div>
              </div>
            </div>
            <div className="app__modal_footer">
                  <CustomButton
                    btnType='submit'
                    handleClick={handlePrint}
                    isDisabled={printing}
                    rightIcon={<DocumentArrowDownIcon className='w-4 h-4'/>}
                    title='Download'
                    containerStyles="app__btn_green flex space-x-2"
                  />
                  <CustomButton
                    btnType='submit'
                    handleClick={hideModal}
                    isDisabled={printing}
                    title='Close'
                    containerStyles="app__btn_gray flex space-x-2"
                  />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
  )
}

export default PrintModal
