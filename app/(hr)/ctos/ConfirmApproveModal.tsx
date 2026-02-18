/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { addYears, format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'

interface ModalProps {
  onCancel: () => void
  onConfirm: (expDate: string, cocBal: string) => void
  message: string
  header: string
  btnText: string
  coc: string
  totalCocCurrentYear?: number
}

export default function ConfirmApproveModal({
  onConfirm,
  header,
  btnText,
  message,
  onCancel,
  coc,
  totalCocCurrentYear = 0
}: ModalProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [expDate, setExpDate] = useState(
    format(addYears(new Date(), 1), 'yyyy-MM-dd')
  )
  const [cocBal, setCocBal] = useState(coc)

  const handleConfirm = () => {
    onConfirm(expDate, cocBal)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onCancel()
    }
    if (event.key === 'Enter') {
      onConfirm(expDate, cocBal)
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
            <h5 className="app__modal_header_text">{header}</h5>
          </div>
          <div className="modal-body relative p-4">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 text-sm mb-1 dark:text-gray-300">
                  {message}
                </div>
              </div>
              <div className="w-full rounded-md border-2 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-4 py-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Total COC (Current Year):{' '}
                  <span className="inline-flex min-w-[2rem] items-center justify-center rounded bg-emerald-500 px-2 py-0.5 text-base font-bold text-white">
                    {totalCocCurrentYear}
                  </span>
                </div>
              </div>
              <div className="w-full">
                <div className="app__label_standard">Expiration Date:</div>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="app__select_standard"
                />
              </div>
              <div className="w-full">
                <div className="app__label_standard">COC:</div>
                <input
                  value={cocBal}
                  onChange={(e) => setCocBal(e.target.value)}
                  className="app__select_standard"
                />
              </div>
              <div className="w-full text-xs text-gray-500">
                <div className="app__label_standard italic">Calculation:</div>
                <div>
                  Holiday/Weekend:{' '}
                  <span className="font-medium">
                    COC = Total Hours * 0.1875
                  </span>
                </div>
                <div>
                  Non-holiday:{' '}
                  <span className="font-medium">COC = Total Hours * 0.125</span>
                </div>
              </div>
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
