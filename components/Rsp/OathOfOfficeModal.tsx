import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface OathOfOfficeModalProps {
  onCancel: () => void
  onConfirm: (date: string) => void
}

export default function OathOfOfficeModal({
  onConfirm,
  onCancel,
}: OathOfOfficeModalProps) {
  const [selectedDate, setSelectedDate] = useState('')

  return (
    <div className="z-50 fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-xl">
        <div className="app__form_field_container">
          <div className="w-full">
            <div className="app__label_standard">Date of Oath:</div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mb-4"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedDate) {
                alert('Please select a date')
                return
              }
              onConfirm(selectedDate)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
