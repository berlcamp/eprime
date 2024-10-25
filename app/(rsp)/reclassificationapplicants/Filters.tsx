import { CustomButton, UserBlock } from '@/components'
import { TagIcon, XMarkIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useState } from 'react'

import { useSupabase } from '@/context/SupabaseProvider'
import type { Employee, RankingTypes } from '@/types'
import { UserIcon } from 'lucide-react'

interface FilterTypes {
  setFilterUser: (employee: string) => void
  setFilterRanking: (type: string) => void
}

const Filters = ({ setFilterUser, setFilterRanking }: FilterTypes) => {
  const [selectedRanking, setSelectedRanking] = useState('')

  const { systemUsers }: { systemUsers: Employee[] } = useSupabase()

  // Search employee
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<Employee[] | []>([])
  const [selectedUserId, setSelectedUserId] = useState('')

  const [rankings, setRankings] = useState<RankingTypes[] | []>([])

  const { supabase } = useSupabase()

  const handleApply = () => {
    if (selectedUserId === '' && selectedRanking === '') return

    // pass filter values to parent
    setFilterUser(selectedUserId)
    setFilterRanking(selectedRanking)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedUserId === '' && selectedRanking === '') return

    // pass filter values to parent
    setFilterUser(selectedUserId)
    setFilterRanking(selectedRanking)
  }

  // clear all filters
  const handleClear = () => {
    setFilterUser('')
    setSelectedUserId('')
    setSelectedItems([])
    setSelectedRanking('')
    setFilterRanking('')
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

  const handleSelected = (item: Employee) => {
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
    const fetchRankings = async () => {
      const { data } = await supabase
        .from('hrm_reclassifications')
        .select('*,position:position_id(name)')
        .eq('status', 'Open')
      if (data) {
        setRankings(data)
      }
    }

    void fetchRankings()
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
                value={selectedRanking}
                onChange={(e) => setSelectedRanking(e.target.value)}
                className="app__filter_select"
              >
                <option value="">All Reclassification Rankings</option>
                {rankings.length > 0 &&
                  rankings.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.position.name} - {item.type}
                    </option>
                  ))}
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
