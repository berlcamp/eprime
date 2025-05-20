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

interface PropTypes {
  filterType: string
  filterStatus: string
  setFilterType: (type: string) => void
  setFilterStatus: (status: string) => void
  setRefresh: () => void
}

const Filters = ({
  filterType,
  filterStatus,
  setFilterType,
  setFilterStatus,
  setRefresh
}: PropTypes) => {
  const handleTypeChange = (val: string) => {
    setFilterType(val === 'All' ? '' : val)
    setRefresh()
  }

  const handleStatusChange = (val: string) => {
    setFilterStatus(val === 'All' ? '' : val)
    setRefresh()
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="type-select">Type</Label>
        <Select value={filterType || 'All'} onValueChange={handleTypeChange}>
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
        <Select
          value={filterStatus || 'All'}
          onValueChange={handleStatusChange}
        >
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
