import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface ModalProps {
  onCancel: () => void
  onConfirm: (
    date: string,
    location: string,
    signatory: string,
    position: string
  ) => void
}

export default function AssumptionModal({ onConfirm, onCancel }: ModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedSignatory, setSelectedSignatory] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  return (
    <div className="z-50 fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-xl">
        <div className="app__form_field_container">
          <div className="w-full">
            <div className="app__label_standard">Select Date & Assignment:</div>
            <div className="flex space-x-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <Input
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                placeholder="Assignment"
                className="app__input_standard"
              />
            </div>
            <div className="app__label_standard mt-4">Select Signatory:</div>
            <div className="flex space-x-1">
              <Input
                value={selectedSignatory}
                onChange={(e) => setSelectedSignatory(e.target.value)}
                placeholder="Signatory"
              />
              <Input
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                placeholder="Position"
                className="app__input_standard"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedDate || !selectedLocation) {
                alert('Please select a date and assignment')
                return
              }
              onConfirm(
                selectedDate,
                selectedLocation,
                selectedSignatory,
                selectedPosition
              ) // ✅ pass values to parent
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
