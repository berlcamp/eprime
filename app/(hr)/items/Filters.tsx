import { CustomButton, UserBlock } from '@/components/index'
import { fetchImplementingUnits, fetchPositions } from '@/utils/fetchApi'
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  TagIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/20/solid'
import React, { useEffect, useState } from 'react'

import { useSupabase } from '@/context/SupabaseProvider'
import type {
  Employee,
  ImplementingUnitTypes,
  PositionTypes,
  namesType
} from '@/types'

interface FilterTypes {
  setFilterNumber: (type: string) => void
  setFilterSchool: (type: string) => void
  setFilterPosition: (type: string) => void
  setFilterUser: (employee: string) => void
  setFilterDuplicates: (type: string) => void
  isSuperAdmin: boolean
}

const Filters = ({
  setFilterNumber,
  setFilterSchool,
  setFilterUser,
  setFilterPosition,
  setFilterDuplicates,
  isSuperAdmin
}: FilterTypes) => {
  const [itemNumber, setItemNumber] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedDuplicates, setSelectedDuplicates] = useState('')

  const [positions, setPositions] = useState<PositionTypes[]>([])
  const [implementingUnits, setImplementingUnits] = useState<
    ImplementingUnitTypes[] | []
  >([])

  const { systemUsers }: { systemUsers: Employee[] } = useSupabase()

  // Search employee
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])
  const [selectedUserId, setSelectedUserId] = useState('')

  const handleApply = () => {
    if (
      itemNumber !== '' &&
      selectedSchool !== '' &&
      selectedPosition !== '' &&
      selectedUserId === ''
    )
      return

    // pass filter values to parent
    setFilterNumber(itemNumber)
    setFilterSchool(selectedSchool)
    setFilterUser(selectedUserId)
    setFilterPosition(selectedPosition)

    // the duplicates scan covers the whole table, it can't be narrowed down
    setSelectedDuplicates('')
    setFilterDuplicates('')
  }

  // The duplicates scan looks at every item, so it replaces the other filters
  // instead of combining with them.
  const handleDuplicates = (value: string) => {
    setSelectedDuplicates(value)

    setItemNumber('')
    setFilterNumber('')
    setSelectedSchool('')
    setFilterSchool('')
    setSelectedPosition('')
    setFilterPosition('')
    setSelectedUserId('')
    setFilterUser('')
    setSelectedItems([])

    setFilterDuplicates(value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (
      itemNumber !== '' &&
      selectedSchool !== '' &&
      selectedPosition !== '' &&
      selectedUserId === ''
    )
      return

    // pass filter values to parent
    setFilterNumber(itemNumber)
    setFilterSchool(selectedSchool)
    setFilterUser(selectedUserId)
    setFilterPosition(selectedPosition)

    // the duplicates scan covers the whole table, it can't be narrowed down
    setSelectedDuplicates('')
    setFilterDuplicates('')
  }

  // clear all filters
  const handleClear = () => {
    setFilterNumber('')
    setItemNumber('')
    setFilterSchool('')
    setSelectedSchool('')
    setFilterPosition('')
    setSelectedPosition('')
    setFilterUser('')
    setSelectedUserId('')
    setSelectedItems([])
    setFilterDuplicates('')
    setSelectedDuplicates('')
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
    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 3000, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }

    const fetchIus = async () => {
      const result = await fetchImplementingUnits('', 3000, 0)
      setImplementingUnits(result.data.length > 0 ? result.data : [])
    }
    void fetchIus()

    void fetchPositionsData()
  }, [])

  return (
    <div className="">
      <div className="items-center space-x-2 space-y-1">
        <form
          onSubmit={handleSubmit}
          className="items-center inline-flex app__filter_field_container"
        >
          <div className="items-center space-y-1">
            <div className="app__filter_container">
              <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
              <input
                placeholder="Item Number"
                value={itemNumber}
                onChange={(e) => setItemNumber(e.target.value)}
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
                    placeholder="Employee"
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
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Implementing Unit</option>
                {implementingUnits.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Position</option>
                {positions.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {isSuperAdmin && (
              <div className="app__filter_container">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                <select
                  value={selectedDuplicates}
                  onChange={(e) => handleDuplicates(e.target.value)}
                  className="app__filter_select"
                >
                  <option value="">Find Duplicates</option>
                  <option value="item_number">Duplicate Item Numbers</option>
                  <option value="employee">
                    Employees with Multiple Items
                  </option>
                </select>
              </div>
            )}
          </div>
        </form>
      </div>
      {selectedDuplicates !== '' && (
        <div className="mt-2 text-xs text-orange-700">
          {selectedDuplicates === 'employee'
            ? 'Showing items whose employee is assigned to more than one item.'
            : 'Showing items that share an item number with another item.'}{' '}
          The other filters do not apply to this list.
        </div>
      )}
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
