import { CustomButton } from '@/components'
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/20/solid'
import React, { useState } from 'react'

interface FilterDistrictTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterType: (keyword: string) => void
}

const Filters = ({ setFilterKeyword, setFilterType }: FilterDistrictTypes) => {
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('')

  const handleApply = () => {
    if (keyword.trim() === '' && type.trim() === '') return

    setFilterKeyword(keyword) // pass to parent
    setFilterType(type) // pass to parent
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '' && type.trim() === '') return

    setFilterKeyword(keyword) // pass to parent
    setFilterType(type) // pass to parent
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
    setFilterType('')
    setType('')
  }

  return (
    <div className="">
      <div className="flex items-center">
        <form onSubmit={handleSubmit} className="items-center">
          <div className="app__filter_container">
            <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
            <input
              placeholder="Search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="app__filter_input"
            />
          </div>
          <div className="app__filter_container">
            <TagIcon className="w-4 h-4 mr-1" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="app__filter_input"
            >
              <option value="">All Types</option>
              <option value="Core Behavioural">Core Behavioural</option>
              <option value="Leadership">Leadership</option>
            </select>
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
