'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { requestTypes } from '@/constants'
import { useEffect, useState } from 'react'

interface PropTypes {
  setFilterType: (type: string) => void
  setFilterStatus: (status: string) => void
}

const Filters = ({ setFilterType, setFilterStatus }: PropTypes) => {
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (status.trim() === '' && type.trim() === '') return
    setFilterType(type === 'All' ? '' : type)
    setFilterStatus(status === 'All' ? '' : status)
  }, [type, status, setFilterType, setFilterStatus])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="type-select">Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type-select" className="w-[200px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {requestTypes.map((requestType, index) => (
              <SelectItem key={index} value={requestType}>
                {requestType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status-select">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status-select" className="w-[200px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Approval Recommended">
              Approval Recommended
            </SelectItem>
            <SelectItem value="For Verification">For Verification</SelectItem>
            <SelectItem value="Disapproved">Disapproved</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default Filters
