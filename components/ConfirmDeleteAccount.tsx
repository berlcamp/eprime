/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'

interface ModalProps {
  onCancel: () => void
  onConfirm: () => void
  actionType?: 'deactivate' | 'reactivate'
}

export default function ConfirmDeleteAccount({
  onCancel,
  onConfirm,
  actionType = 'deactivate'
}: ModalProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [btnDisabled, setBtnDisabled] = useState(true)

  const isReactivate = actionType === 'reactivate'
  const confirmText = isReactivate ? 'reactivate' : 'deactivate'

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onCancel()
    }
    if (event.key === 'Enter' && !btnDisabled) {
      onConfirm()
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    if (newValue.toLowerCase() === confirmText) {
      setBtnDisabled(false)
    } else {
      setBtnDisabled(true)
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [wrapperRef])

  return (
    <div ref={wrapperRef} className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Confirm {isReactivate ? 'Reactivate' : 'Deactivate'} Account
            </h5>
          </div>
          <div className="modal-body relative p-4">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 text-sm mb-1 dark:text-gray-300">
                  Confirm {actionType === 'reactivate' ? 'reactivation' : 'deactivation'} of this account by typing '{confirmText}' below:
                </div>
                <div>
                  <input
                    onChange={handleInputChange}
                    value={inputValue}
                    type="text"
                    className="app__input_standard"
                  />
                </div>
              </div>
            </div>

            <div className="app__modal_footer">
              <button
                disabled={btnDisabled}
                onClick={onConfirm}
                type="button"
                className={btnDisabled ? 'app__btn_gray' : (isReactivate ? 'app__btn_green' : 'app__btn_red')}
              >
                Confirm {isReactivate ? 'Reactivate' : 'Deactivate'}
              </button>
              <button
                onClick={onCancel}
                type="button"
                className="app__btn_gray"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
