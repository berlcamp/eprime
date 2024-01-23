import React, { useState } from 'react'
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/20/solid'
import { CustomButton } from '@/components'

interface FilterTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterStatus: (type: string) => void
}

const Filters = ({ setFilterKeyword, setFilterStatus }: FilterTypes) => {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [keyword, setKeyword] = useState<string>('')
  const handleApply = () => {
    if (keyword.trim() === '' && selectedStatus === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterStatus(selectedStatus)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '' && selectedStatus === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterStatus(selectedStatus)
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
    setFilterStatus('')
    setSelectedStatus('')
  }

  return (
    <div className=''>
      <div className='items-center space-x-2 space-y-1'>
        <form onSubmit={handleSubmit} className='items-center inline-flex app__filter_field_container'>
          <div className='items-center space-y-1'>
            <div className='app__filter_container'>
              <MagnifyingGlassIcon className="w-4 h-4 mr-1"/>
              <input
                placeholder='Search Reference Code'
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="app__filter_input"/>
            </div>
            <div className='app__filter_container'>
              <TagIcon className="w-4 h-4 mr-1"/>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className='app__filter_select'>
                  <option value=''>Status:</option>
                  <option value='Active'>Active</option>
                  <option value='Expired'>Expired</option>
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
