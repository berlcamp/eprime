/* eslint-disable react-hooks/exhaustive-deps */
import { CustomButton } from '@/components/index'
import { useEffect, useState } from 'react'
import { printLetter } from './printLetter'

// Types
import type { AssignmentTypes } from '@/types'
import { capitalizeWords } from '@/utils/text-helper'
import { DocumentArrowDownIcon } from '@heroicons/react/20/solid'

interface ModalProps {
  hideModal: () => void
  item: AssignmentTypes
  variant: 'intent' | 'exigency'
}

const PrintModal = ({ item, hideModal, variant }: ModalProps) => {
  const [letterDate, setLetterDate] = useState(
    new Date().toISOString().substr(0, 10)
  )
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

    void printLetter(item, letterDate, letterSubject, letterContent, variant)

    setPrinting(false)
  }

  useEffect(() => {
    const station = item.area_assigned === 'school'
      ? item.hrm_schools?.name
      : item.hrm_offices?.name
    const position = item.hrm_positions?.name ?? ''

    // **...** marks text the printed PDF will render in bold.
    let content = ''
    if (variant === 'intent') {
      content =
        'In the exigency of service, you are hereon advised of your reassignment as **' +
        position +
        '** from [previous station] **to ' +
        station +
        '** effective immediately.'
      content +=
        '\nAs such, you are to perform duties and responsibilities concomitant to your position.'
      content +=
        '\nIt is understood that you should clear yourself of all money and property accountabilities in your present station.'
      content += '\nPlease be guided accordingly.'
    } else {
      content =
        'In the exigency of service, you are hereby informed of your reassignment as **' +
        position +
        '** from your current assigned school, [previous station], to **' +
        station +
        '**, effective immediately.'
      content +=
        '\nAs such, you are to perform duties and responsibilities concomitant to your position.'
      content += '\nYou are further advised to report immediately to your School Head/s.'
      content += '\nPlease be guided accordingly.'
    }

    setLetterContent(content)
    setLetterSubject('REASSIGNMENT ORDER')
  }, [variant])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Letter</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">To:</div>
                  <div className="app__label_value">
                    <div>
                      {capitalizeWords(
                        item.hrm_users?.firstname +
                          ' ' +
                          item.hrm_users?.middlename +
                          ' ' +
                          item.hrm_users?.lastname
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">From:</div>
                  <div className="app__label_value">
                    <div>
                      {capitalizeWords(`${process.env.NEXT_PUBLIC_SDS ?? ''}`)}
                    </div>
                    <div className="font-light">
                      OIC-Schools Division Superintendent
                    </div>
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Date:</div>
                  <div>
                    <input
                      onChange={(e) => setLetterDate(e.target.value)}
                      value={letterDate}
                      type="date"
                      className="app__select_standard"
                    />
                    {errorMessage && (
                      <div className="text-xs text-red-500 mt-2 flex space-x-2">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Subject:</div>
                  <div>
                    <input
                      onChange={(e) => setLetterSubject(e.target.value)}
                      value={letterSubject}
                      type="text"
                      className="app__select_standard"
                    />
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Content:</div>
                  <div>
                    <textarea
                      onChange={(e) => setLetterContent(e.target.value)}
                      value={letterContent}
                      rows={10}
                      className="app__select_standard"
                    />
                  </div>
                </div>
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  handleClick={handlePrint}
                  isDisabled={printing}
                  rightIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
                  title="Download"
                  containerStyles="app__btn_green flex space-x-2"
                />
                <CustomButton
                  btnType="submit"
                  handleClick={hideModal}
                  isDisabled={printing}
                  title="Close"
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
