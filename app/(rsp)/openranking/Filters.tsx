import { CustomButton } from '@/components/index'
import { TagIcon } from '@heroicons/react/20/solid'
import React, { useState } from 'react'

import { useRankingOptions } from '@/hooks/useRankingOptions'

interface FilterTypes {
  setFilterRanking: (type: string) => void
}

const Filters = ({ setFilterRanking }: FilterTypes) => {
  const [selectedRanking, setSelectedRanking] = useState('')


  const { rankings, error } = useRankingOptions({})

  const handleApply = () => {
    if (selectedRanking === '') return

    // pass filter values to parent
    setFilterRanking(selectedRanking)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedRanking === '') return

    // pass filter values to parent
    setFilterRanking(selectedRanking)
  }

  // clear all filters
  const handleClear = () => {
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
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedRanking}
                onChange={(e) => setSelectedRanking(e.target.value)}
                className="app__filter_select"
              >
                {error && <option value="">{error.message}</option>}
                {!error && rankings.length === 0 && (
                  <option value="">No Closed Rankings Yet</option>
                )}
                {rankings.length > 0 && (
                  <option value="">Choose Ranking</option>
                )}
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
