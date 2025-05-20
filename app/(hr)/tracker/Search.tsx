/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
'use client'

import { UserBlock } from '@/components/index'
import { requestTypes } from '@/constants'
import { useSupabase } from '@/context/SupabaseProvider'
import { Employee, namesType, Office, SchoolTypes } from '@/types'
import { useEffect, useState } from 'react'

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
  filterKeyword: string
  filterRequester: string
  filterDate: string
  filterType: string
  filterStatus: string
  filterSchool: string
  filterOffice: string
  setFilterKeyword: (keyword: string) => void
  setFilterRequester: (id: string) => void
  setFilterDate: (date: string) => void
  setFilterType: (type: string) => void
  setFilterStatus: (status: string) => void
  setFilterSchool: (school: string) => void
  setFilterOffice: (office: string) => void
  setRefresh: () => void
}

const Search = ({
  filterKeyword,
  filterRequester,
  filterDate,
  filterType,
  filterStatus,
  filterSchool,
  filterOffice,
  setFilterKeyword,
  setFilterRequester,
  setFilterDate,
  setFilterType,
  setFilterStatus,
  setFilterSchool,
  setFilterOffice,
  setRefresh
}: PropTypes) => {
  // Local state synced with props for controlled inputs
  const [keyword, setKeyword] = useState(filterKeyword)
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[]>([])
  const [dateRequested, setDateRequested] = useState(filterDate)
  const [type, setType] = useState(filterType)
  const [status, setStatus] = useState(filterStatus)
  const [school, setSchool] = useState(filterSchool)
  const [office, setOffice] = useState(filterOffice)

  const {
    systemSchools,
    systemOffices,
    systemUsers
  }: {
    systemSchools: SchoolTypes[]
    systemOffices: Office[]
    systemUsers: any
  } = useSupabase()

  // Sync internal state when props change (e.g. on reset)
  useEffect(() => {
    setKeyword(filterKeyword)
  }, [filterKeyword])

  useEffect(() => {
    setDateRequested(filterDate)
  }, [filterDate])

  useEffect(() => {
    setType(filterType)
  }, [filterType])

  useEffect(() => {
    setStatus(filterStatus)
  }, [filterStatus])

  useEffect(() => {
    setSchool(filterSchool)
  }, [filterSchool])

  useEffect(() => {
    setOffice(filterOffice)
  }, [filterOffice])

  useEffect(() => {
    // When filterRequester changes externally, update selectedItems accordingly
    if (!filterRequester) {
      setSelectedItems([])
      setSearchHead('')
    } else {
      // Find user by id and update selectedItems
      const user = systemUsers.find(
        (u: { id: string }) => u.id === filterRequester
      )
      if (user) setSelectedItems([user])
    }
  }, [filterRequester, systemUsers])

  const handleApply = () => {
    if (
      keyword.trim() === '' &&
      filterRequester === '' &&
      !dateRequested &&
      !type &&
      !school &&
      !office &&
      !status
    ) {
      return
    }

    setFilterKeyword(keyword)
    setFilterDate(dateRequested)
    setFilterType(type)
    setFilterStatus(status)
    setFilterSchool(school)
    setFilterOffice(office)

    // refresh data from parent
    setRefresh()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleApply()
  }

  const handleClear = () => {
    setKeyword('')
    setSearchHead('')
    setSelectedItems([])
    setDateRequested('')
    setType('')
    setStatus('')
    setFilterKeyword('')
    setFilterRequester('')
    setFilterDate('')
    setFilterType('')
    setFilterStatus('')
    setFilterSchool('')
    setFilterOffice('')
    setRefresh()
  }

  const handleSearchUser = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setSelectedItems([item])
    setSearchResults([])
    setSearchHead('')
    setFilterRequester(item.id)
  }

  const handleRemoveSelected = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id))
    setFilterRequester('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
              autoComplete="off"
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
                    autoComplete="off"
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
              autoComplete="off"
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
        {/* School */}
        <div className="space-y-2">
          <Label htmlFor="status">School</Label>
          <Select value={school} onValueChange={setSchool}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select School">
                {school
                  ? systemSchools.find((item) => item.id.toString() === school)
                      ?.name || 'Select School'
                  : 'Select School'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {systemSchools.map((item, index) => (
                <SelectItem key={index} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Office */}
        <div className="space-y-2">
          <Label htmlFor="office">Office</Label>
          <Select value={office} onValueChange={setOffice}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Office">
                {office
                  ? systemOffices.find((item) => item.id.toString() === office)
                      ?.name || 'Select Office'
                  : 'Select Office'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {systemOffices.map((item, index) => (
                <SelectItem key={index} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-6">
        <Button type="submit">Search</Button>
        <Button type="button" variant="secondary" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </form>
  )
}

export default Search
