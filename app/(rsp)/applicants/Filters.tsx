import { CustomButton } from '@/components/index'
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/20/solid'
import React, { useState } from 'react'

import { useRankingOptions } from '@/hooks/useRankingOptions'

interface FilterTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterRanking: (type: string) => void
}

const Filters = ({ setFilterKeyword, setFilterRanking }: FilterTypes) => {
  const [selectedRanking, setSelectedRanking] = useState('')
  const [keyword, setKeyword] = useState('')


  const { rankings, error } = useRankingOptions({ status: 'Open' })

  const handleApply = () => {
    if (keyword.trim() === '' && selectedRanking === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterRanking(selectedRanking)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '' && selectedRanking === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterRanking(selectedRanking)
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
    setSelectedRanking('')
    setFilterRanking('')
  }

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
                placeholder="Search Applicant"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="app__filter_input"
              />
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedRanking}
                onChange={(e) => setSelectedRanking(e.target.value)}
                className="app__filter_select"
              >
                <option value="">All Rankings</option>
                {error && <option value="">{error.message}</option>}
                {rankings.length > 0 &&
                  rankings.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.position?.name} - {item.type} - {item.year}
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
