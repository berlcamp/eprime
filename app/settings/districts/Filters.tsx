import { CustomButton } from '@/components/index'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import React, { useState } from 'react'

interface FilterDistrictTypes {
  setFilterKeyword: (keyword: string) => void
}

const Filters = ({ setFilterKeyword }: FilterDistrictTypes) => {
  const [keyword, setKeyword] = useState<string>('')

  const handleApply = () => {
    if (keyword.trim() === '') return

    setFilterKeyword(keyword) // pass keyword to parent
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '') return

    setFilterKeyword(keyword) // pass keyword to parent
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
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
