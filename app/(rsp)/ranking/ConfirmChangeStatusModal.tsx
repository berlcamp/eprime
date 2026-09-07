/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useRef, useState } from 'react'

interface ModalProps {
  onCancel: () => void
  onConfirm: (reason: string) => void
  message: string
  status: string
  header: string
  btnText: string
  /** Prefills the reason box, so an existing reason can be corrected rather
   *  than retyped from nothing. */
  initialReason?: string
}

export default function ConfirmChangeStatusModal({
  onConfirm,
  header,
  status,
  btnText,
  message,
  onCancel,
  initialReason = ''
}: ModalProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [reason, setReason] = useState(initialReason)

  // The keydown listener is registered once, so it cannot reach the current
  // reason through the closure it was created with. It used to confirm with
  // the empty string the first render captured, so any Enter key filed the
  // disqualification with no reason at all.
  const latest = useRef({ reason, onConfirm, onCancel })
  useEffect(() => {
    latest.current = { reason, onConfirm, onCancel }
  })

  const handleConfirm = () => {
    onConfirm(reason)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { reason, onConfirm, onCancel } = latest.current

      if (event.key === 'Escape') {
        onCancel()
        return
      }

      if (event.key === 'Enter') {
        // Enter inside the reason box starts a new line. Confirming on it cut
        // a multi-line reason off at the first break.
        if (event.target instanceof HTMLTextAreaElement) return
        onConfirm(reason)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">{header}</h5>
          </div>
          <div className="modal-body relative p-4">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 text-sm mb-1 dark:text-gray-300">
                  {message}
                </div>
              </div>
              {status === 'Disqualified' && (
                <div className="w-full">
                  <div className="app__label_standard">
                    Reason for Disqualification:
                  </div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="app__input_standard"
                  />
                </div>
              )}
            </div>

            <div className="app__modal_footer">
              <button
                onClick={handleConfirm}
                type="button"
                className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
              >
                {btnText}
              </button>
              <button
                onClick={onCancel}
                type="button"
                className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
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
