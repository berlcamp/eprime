'use client'

import { UserBlock } from '@/components/index'
import { requestTypes } from '@/constants'
import { useSupabase } from '@/context/SupabaseProvider'
import { Employee, namesType } from '@/types'
import { useState } from 'react'

import {
  CalendarIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/20/solid'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface PropTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterRequester: (status: string) => void
  setFilterDate: (date: string) => void
  setFilterType: (type: string) => void
  setFilterStatus: (status: string) => void
}

const Search = ({
  setFilterKeyword,
  setFilterRequester,
  setFilterDate,
  setFilterType,
  setFilterStatus
}: PropTypes) => {
  const [keyword, setKeyword] = useState('')
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[]>([])
  const [selectedRequesterId, setSelectedRequesterId] = useState('')

  const [dateRequested, setDateRequested] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')

  const { systemUsers } = useSupabase()

  const handleApply = () => {
    if (
      keyword.trim() === '' &&
      selectedRequesterId === '' &&
      !dateRequested &&
      !type &&
      !status
    )
      return

    setFilterKeyword(keyword)
    setFilterRequester(selectedRequesterId)
    setFilterDate(dateRequested)
    setFilterType(type)
    setFilterStatus(status)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleApply()
  }

  const handleClear = () => {
    setKeyword('')
    setSelectedRequesterId('')
    setSelectedItems([])
    setSearchHead('')
    setDateRequested('')
    setType('')
    setStatus('')

    setFilterKeyword('')
    setFilterRequester('')
    setFilterDate('')
    setFilterType('')
    setFilterStatus('')
  }

  const handleSearchUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value
    setSearchHead(searchTerm)

    if (searchTerm.trim().length < 3) {
      setSearchResults([])
      return
    }

    const searchWords = searchTerm.toLowerCase().split(' ')
    const results = systemUsers.filter((user: any) => {
      const fullName =
        `${user.lastname} ${user.firstname} ${user.middlename}`.toLowerCase()
      return searchWords.every((word) => fullName.includes(word))
    })

    setSearchResults(results)
  }

  const handleSelected = (item: namesType) => {
    setSelectedRequesterId(item.id)
    setSelectedItems([item])
    setSearchResults([])
    setSearchHead('')
  }

  const handleRemoveSelected = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedRequesterId('')
    setFilterRequester('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        {/* Reference Code */}
        <div className="space-y-2">
          <Label htmlFor="keyword">Reference Code</Label>
          <div className="relative flex items-center">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 text-muted-foreground" />
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter code"
              className="pl-8"
            />
          </div>
        </div>

        {/* Requester */}
        <div className="space-y-2">
          <Label htmlFor="requester">Requester</Label>
          <div className="relative">
            {selectedItems.length > 0 ? (
              selectedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center text-sm bg-muted px-2 py-1 rounded-md"
                >
                  {item.firstname} {item.middlename} {item.lastname}
                  <XMarkIcon
                    className="w-4 h-4 ml-2 cursor-pointer text-muted-foreground"
                    onClick={() => handleRemoveSelected(item.id)}
                  />
                </div>
              ))
            ) : (
              <>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 absolute left-2 text-muted-foreground" />
                  <Input
                    id="requester"
                    value={searchHead}
                    onChange={handleSearchUser}
                    placeholder="Search requester"
                    className="pl-8"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white dark:bg-black shadow-md">
                    {searchResults.map((user, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelected(user)}
                        className="cursor-pointer px-4 py-2 hover:bg-muted"
                      >
                        <UserBlock user={user} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Date Requested */}
        <div className="space-y-2">
          <Label htmlFor="date">Date Requested</Label>
          <div className="relative flex items-center">
            <CalendarIcon className="w-4 h-4 absolute left-2 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              value={dateRequested}
              onChange={(e) => setDateRequested(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {requestTypes.map((t, index) => (
                <SelectItem key={index} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
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

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button type="submit">Search</Button>
        <Button type="button" variant="secondary" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </form>
  )
}

export default Search
