'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PrintModal } from '@/components/Rsp/PrintModal'
import { useState } from 'react'

interface AssumptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (
    date: string,
    location: string,
    signatory: string,
    position: string
  ) => void
}

export default function AssumptionModal({
  open,
  onOpenChange,
  onConfirm,
}: AssumptionModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedSignatory, setSelectedSignatory] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  const handleConfirm = () => {
    if (!selectedDate || !selectedLocation) return
    onConfirm(
      selectedDate,
      selectedLocation,
      selectedSignatory,
      selectedPosition
    )
    onOpenChange(false)
  }

  return (
    <PrintModal
      open={open}
      onOpenChange={onOpenChange}
      title="Print Assumption to Duty"
      description="Enter the date, assignment, and signatory details"
      onConfirm={handleConfirm}
      confirmDisabled={!selectedDate || !selectedLocation}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="assumption-date">Date</Label>
          <Input
            id="assumption-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assumption-location">Place of Assignment</Label>
          <Input
            id="assumption-location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            placeholder="e.g., Schools Division Office"
          />
        </div>
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-3 text-sm font-medium text-slate-600">
            Signatory (optional)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assumption-signatory">Name</Label>
              <Input
                id="assumption-signatory"
                value={selectedSignatory}
                onChange={(e) => setSelectedSignatory(e.target.value)}
                placeholder="Signatory name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assumption-position">Position</Label>
              <Input
                id="assumption-position"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                placeholder="Signatory position"
              />
            </div>
          </div>
        </div>
      </div>
    </PrintModal>
  )
}
