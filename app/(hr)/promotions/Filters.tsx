import React, { useEffect, useState } from 'react'
import { TagIcon, UserIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { CustomButton, UserBlock } from '@/components'
import { fetchItems } from '@/utils/fetchApi'

import type { Employee, ItemTypes, namesType } from '@/types'
import { useSupabase } from '@/context/SupabaseProvider'

interface FilterTypes {
  setFilterPosition: (type: string) => void
  setFilterUser: (employee: string) => void
}

const Filters = ({ setFilterUser, setFilterPosition }: FilterTypes) => {
  const [selectedPosition, setSelectedPosition] = useState('')
  const [positions, setPositions] = useState<ItemTypes[] | []>([])

  const { systemUsers }: { systemUsers: Employee[] } = useSupabase()

  // Search employee
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])
  const [selectedUserId, setSelectedUserId] = useState('')

  const handleApply = () => {
    if (selectedPosition !== '' && selectedUserId === '') return

    // pass filter values to parent
    setFilterUser(selectedUserId)
    setFilterPosition(selectedPosition)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedPosition !== '' && selectedUserId === '') return

    // pass filter values to parent
    setFilterUser(selectedUserId)
    setFilterPosition(selectedPosition)
  }

  // clear all filters
  const handleClear = () => {
    setFilterPosition('')
    setSelectedPosition('')
    setFilterUser('')
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
    const searchWords = (e.target.value).split(' ')
    const results = systemUsers.filter(user => {
      const fullName = `${user.lastname} ${user.firstname} ${user.middlename}`.toLowerCase()
      return searchWords.every(word => fullName.includes(word))
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
    setSelectedItems(prevSelectedItems => prevSelectedItems.filter(item => item.id !== id))
    setSelectedUserId('')
  }
  // End - Search employees

  // Featch data
  useEffect(() => {
    const fetchPositionsData = async () => {
      const result = await fetchItems({}, 3000, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }
    void fetchPositionsData()
  }, [])

  return (
    <div className=''>
      <div className='items-center space-x-2 space-y-1'>
        <form onSubmit={handleSubmit} className='items-center inline-flex app__filter_field_container'>
          <div className='items-center space-y-1'>
            <div className='app__filter_container'>
              <UserIcon className="w-4 h-4 mr-1"/>
              {
                selectedItems.length > 0 &&
                  selectedItems.map((item, index) => (
                    <div key={index} className='text-gray-500 focus:ring-0 focus:outline-none text-xs py-1 text-left inline-flex items-center dark:bg-gray-300'>
                      <span className='inline-flex items-center text-xs border border-gray-400 rounded-sm px-1 bg-gray-300'>
                        {item.firstname} {item.middlename} {item.lastname}
                        <XMarkIcon onClick={() => handleRemoveSelected(item.id)} className='w-4 h-4 ml-2 cursor-pointer'/>
                      </span>
                    </div>
                  ))
              }
              {
                selectedItems.length === 0 &&
                  <div className='relative'>
                    <input
                      type="text"
                      placeholder='Employee'
                      value={searchHead}
                      onChange={async (e) => await handleSearchUser(e)}
                      className='app__filter_input'/>

                      {
                        searchResults.length > 0 &&
                          <div className='app__search_user_results_container'>
                            {
                              searchResults.map((user: namesType, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleSelected(user)}
                                  className='app__search_user_results'>
                                    <UserBlock user={user}/>
                                </div>
                              ))
                            }
                          </div>
                      }
                  </div>
              }
            </div>
            <div className='app__filter_container'>
              <TagIcon className="w-4 h-4 mr-1"/>
              <select
                value={selectedPosition}
                onChange={e => setSelectedPosition(e.target.value)}
                className='app__filter_select'>
                  <option value=''>Choose Position</option>
                  {
                    positions.map((item, index) => (
                      <option key={index} value={item.id}>{item.hrm_position?.name}</option>
                    ))
                  }
              </select>
            </div>
          </div>
        </form>
      </div>
      <div className='flex items-center space-x-2 mt-4'>
        <CustomButton
              containerStyles='app__btn_green'
              title='Apply Filter'
              btnType='button'
              handleClick={handleApply}
            />
          <CustomButton
              containerStyles='app__btn_gray'
              title='Clear Filter'
              btnType='button'
              handleClick={handleClear}
            />
      </div>
    </div>
  )
}

export default Filters
