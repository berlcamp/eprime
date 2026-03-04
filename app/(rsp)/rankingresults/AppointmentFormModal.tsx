'use client'

import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface AppointmentFormModalProps {
  onCancel: () => void
  onConfirm: (
    date: string,
    employmentStatus: string,
    natureOfAppointment: string,
    assignment: string
  ) => void
}

export default function AppointmentFormModal({
  onConfirm,
  onCancel,
}: AppointmentFormModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('Permanent')
  const [natureOfAppointment, setNatureOfAppointment] = useState('Original')
  const [assignment, setAssignment] = useState(
    'Schools Division Office of Bayugan City'
  )

  return (
    <div className="z-50 fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-xl max-w-md">
        <div className="app__form_field_container space-y-4">
          <div>
            <div className="app__label_standard">Date of Appointment:</div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mb-2"
            />
          </div>
          <div>
            <div className="app__label_standard">Employment Status:</div>
            <select
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporary</option>
              <option value="Casual">Casual</option>
            </select>
          </div>
          <div>
            <div className="app__label_standard">Nature of Appointment:</div>
            <select
              value={natureOfAppointment}
              onChange={(e) => setNatureOfAppointment(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Original">Original</option>
              <option value="Promotion">Promotion</option>
              <option value="Transfer">Transfer</option>
              <option value="Reemployment">Reemployment</option>
              <option value="Reappointment">Reappointment</option>
            </select>
          </div>
          <div>
            <div className="app__label_standard">Place of Assignment:</div>
            <Input
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              placeholder="Place of assignment"
              className="app__input_standard"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedDate) {
                alert('Please select a date')
                return
              }
              onConfirm(
                selectedDate,
                employmentStatus,
                natureOfAppointment,
                assignment
              )
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
