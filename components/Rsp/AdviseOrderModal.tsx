'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PrintModal } from './PrintModal'
import { useState } from 'react'

interface AdviseOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (date: string, location: string) => void
}

export function AdviseOrderModal({
  open,
  onOpenChange,
  onConfirm,
}: AdviseOrderModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const handleConfirm = () => {
    if (!selectedDate || !selectedLocation) return
    onConfirm(selectedDate, selectedLocation)
    onOpenChange(false)
  }

  return (
    <PrintModal
      open={open}
      onOpenChange={onOpenChange}
      title="Print Advise Order"
      description="Enter the date and assignment for the advise order"
      onConfirm={handleConfirm}
      confirmDisabled={!selectedDate || !selectedLocation}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="advise-date">Date</Label>
          <Input
            id="advise-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="advise-assignment">Place of Assignment</Label>
          <Input
            id="advise-assignment"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            placeholder="e.g., Schools Division Office"
          />
        </div>
      </div>
    </PrintModal>
  )
}
