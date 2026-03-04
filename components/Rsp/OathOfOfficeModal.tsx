'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PrintModal } from './PrintModal'
import { useState } from 'react'

interface OathOfOfficeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (date: string) => void
}

export default function OathOfOfficeModal({
  open,
  onOpenChange,
  onConfirm,
}: OathOfOfficeModalProps) {
  const [selectedDate, setSelectedDate] = useState('')

  const handleConfirm = () => {
    if (!selectedDate) return
    onConfirm(selectedDate)
    onOpenChange(false)
  }

  return (
    <PrintModal
      open={open}
      onOpenChange={onOpenChange}
      title="Print Oath of Office"
      description="Enter the date of the oath ceremony"
      onConfirm={handleConfirm}
      confirmDisabled={!selectedDate}
    >
      <div className="space-y-2">
        <Label htmlFor="oath-date">Date of Oath</Label>
        <Input
          id="oath-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
    </PrintModal>
  )
}
