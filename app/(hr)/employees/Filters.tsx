import { CustomButton, UserBlock } from '@/components'
import { fetchOffices, fetchSchools } from '@/utils/fetchApi'
import { TagIcon, UserIcon, XMarkIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useState } from 'react'

import { useSupabase } from '@/context/SupabaseProvider'
import {
  type Employee,
  type namesType,
  type Office,
  type SchoolTypes
} from '@/types'

interface FilterTypes {
  setFilterUser: (id: string) => void
  setFilterSchool: (type: string) => void
  setFilterOffice: (type: string) => void
  setFilterSetupStatus: (type: string) => void
}

const Filters = ({
  setFilterUser,
  setFilterSchool,
  setFilterOffice,
  setFilterSetupStatus
}: FilterTypes) => {
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [selectedSetupStatus, setSelectedSetupStatus] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[]>([])
  const [offices, setOffices] = useState<Office[]>([])

  const { systemUsers }: { systemUsers: Employee[] } = useSupabase()

  // Search employee
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])
  const [selectedUserId, setSelectedUserId] = useState('')

  const handleApply = () => {
    if (
      selectedUserId === '' &&
      selectedSchool !== '' &&
      selectedOffice !== '' &&
      selectedSetupStatus === ''
    )
      return

    // pass filter values to parent
    setFilterUser(selectedUserId)
    setFilterSchool(selectedSchool)
    setFilterOffice(selectedOffice)
    setFilterSetupStatus(selectedSetupStatus)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (
      selectedUserId === '' &&
      selectedSchool !== '' &&
      selectedOffice !== '' &&
      selectedSetupStatus === ''
    )
      return

    // pass filter values to parent
    setFilterUser(selectedUserId)
    setFilterSchool(selectedSchool)
    setFilterOffice(selectedOffice)
    setFilterSetupStatus(selectedSetupStatus)
  }

  // clear all filters
  const handleClear = () => {
    setFilterUser('')
    setFilterSchool('')
    setSelectedSchool('')
    setFilterOffice('')
    setSelectedOffice('')
    setFilterSetupStatus('')
    setSelectedSetupStatus('')
    setSelectedUserId('')
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
    const results = systemUsers.filter((user) => {
      const fullName =
        `${user.lastname} ${user.firstname} ${user.middlename}`.toLowerCase()
      return searchWords.every((word) => fullName.includes(word))
    })

    setSearchResults(results)
  }

  const handleSelected = (item: namesType) => {
    setSelectedUserId(item.id)
    setSelectedItems([item])

    setSearchResults([])
    setSearchHead('')
  }
  const handleRemoveSelected = (id: string) => {
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.filter((item) => item.id !== id)
    )
    setSelectedUserId('')
  }
  // End - Search employees

  // Featch data
  useEffect(() => {
    const fetchSchoolsData = async () => {
      const result = await fetchSchools({}, 300, 0)
      setSchools(result.data.length > 0 ? result.data : [])
    }
    const fetchOfficesData = async () => {
      const result = await fetchOffices('', 300, 0)
      setOffices(result.data.length > 0 ? result.data : [])
    }
    void fetchSchoolsData()
    void fetchOfficesData()
  }, [])

  return (
    <div className="">
      <div className="items-center space-y-1">
        <form
          onSubmit={handleSubmit}
          className="items-center app__filter_field_container"
        >
          <div className="items-center space-y-1">
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
                    placeholder="Employee"
                    value={searchHead}
                    onChange={async (e) => await handleSearchUser(e)}
                    className="app__filter_input"
                  />

                  {searchResults.length > 0 && (
                    <div className="app__search_user_results_container">
                      {searchResults.map((user: namesType, index) => (
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
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose School</option>
                {schools.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Office</option>
                {offices.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedSetupStatus}
                onChange={(e) => setSelectedSetupStatus(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Account Setup:</option>
                <option value="Completed">Completed</option>
                <option value="Incomplete">Incomplete</option>
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
