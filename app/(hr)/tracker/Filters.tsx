/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { CustomButton, UserBlock } from '@/components'
import { requestTypes } from '@/constants'
import { useSupabase } from '@/context/SupabaseProvider'
import type { Employee, namesType } from '@/types'
import {
  MagnifyingGlassIcon,
  TagIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/20/solid'
import React, { useState } from 'react'

interface PropTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterType: (type: string) => void
  setFilterStatus: (status: string) => void
  setFilterRequester: (status: string) => void
}

const Filters = ({
  setFilterKeyword,
  setFilterType,
  setFilterStatus,
  setFilterRequester
}: PropTypes) => {
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')

  // Search employee
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])
  const [selectedRequesterId, setSelectedRequesterId] = useState('')

  const { systemUsers } = useSupabase()

  const handleApply = () => {
    if (
      keyword.trim() === '' &&
      status.trim() === '' &&
      type.trim() === '' &&
      selectedRequesterId === ''
    )
      return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterType(type)
    setFilterStatus(status)
    setFilterRequester(selectedRequesterId)
  }

  const handleSubmit = () => {
    if (
      keyword.trim() === '' &&
      status.trim() === '' &&
      type.trim() === '' &&
      selectedRequesterId === ''
    )
      return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterType(type)
    setFilterStatus(status)
    setFilterRequester(selectedRequesterId)
  }

  // clear all filters
  const handleClear = () => {
    if (
      keyword.trim() === '' &&
      status.trim() === '' &&
      type.trim() === '' &&
      selectedRequesterId === ''
    )
      return

    // pass filter values to parent
    setFilterKeyword('')
    setFilterType('')
    setFilterStatus('')
    setFilterRequester('')

    setType('')
    setKeyword('')
    setStatus('')
    setSelectedRequesterId('')
    setSelectedItems([])
  }

  // Search employees
  const handleSearchUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value
    setSearchHead(searchTerm)

    if (searchTerm.trim().length < 3) {
      setSearchResults([])
      return
    }

    // Search user
    const searchWords = e.target.value.split(' ')
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
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.filter((item) => item.id !== id)
    )
    setFilterRequester('')
  }
  // End - Search employees

  return (
    <div className="">
      <div className="items-center space-y-2 space-x-1">
        <form
          onSubmit={handleSubmit}
          className="inline-flex items-center app__filter_field_container"
        >
          <div className="items-center space-y-1">
            <div className="app__filter_container">
              <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
              <input
                placeholder="Reference Code"
                value={keyword}
                type="text"
                onChange={(e) => setKeyword(e.target.value)}
                className="app__filter_input"
              />
            </div>
            <div className="app__filter_container">
              <UserIcon className="w-4 h-4 mr-1" />
              {selectedItems.length > 0 &&
                selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="text-gray-500 focus:ring-0 focus:outline-none text-xs py-1 text-left inline-flex items-center dark:bg-gray-300"
                  >
                    <span className="inline-flex items-center text-xs border border-gray-400 rounded-sm px-1 bg-gray-300">
                      {item.firstname} {item.middlename} {item.lastname}
                      <XMarkIcon
                        onClick={() => handleRemoveSelected(item.id)}
                        className="w-4 h-4 ml-2 cursor-pointer"
                      />
                    </span>
                  </div>
                ))}
              {selectedItems.length === 0 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Requester"
                    value={searchHead}
                    onChange={async (e) => await handleSearchUser(e)}
                    className="app__filter_input"
                  />

                  {searchResults.length > 0 && (
                    <div className="app__search_user_results_container">
                      {searchResults.map((user: Employee, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelected(user)}
                          className="app__search_user_results"
                        >
                          <UserBlock user={user} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Type:</option>
                {requestTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Status:</option>
                <option value="Approved">Approved</option>
                <option value="Approval Recommended">
                  Approval Recommended
                </option>
                <option value="For Verification">For Verification</option>
                <option value="Disapproved">Disapproved</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div className="flex items-center space-x-2 mt-4">
        <CustomButton
          containerStyles="app__btn_green"
          title="Apply Filter"
          btnType="button"
          handleClick={handleApply}
        />
        <CustomButton
          containerStyles="app__btn_gray"
          title="Clear Filter"
          btnType="button"
          handleClick={handleClear}
        />
      </div>
    </div>
  )
}

export default Filters
