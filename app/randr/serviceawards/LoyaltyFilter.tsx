'use client'

import { CustomButton } from '@/components/index'
import { useState } from 'react'

interface FilterProps {
  setFilterYears: (years: number | null) => void
}

const options = [5, 10, 15, 20, 25, 30, 35, 40, 45]

const LoyaltyFilter = ({ setFilterYears }: FilterProps) => {
  const [selected, setSelected] = useState<number | null>(null)

  const handleApply = () => {
    setFilterYears(selected)
  }

  const handleClear = () => {
    setSelected(null)
    setFilterYears(null)
  }

  return (
    <div className="">
      <div className="items-center space-y-1">
        <div className="app__filter_field_container">
          <div className="app__filter_container">
            <select
              className="app__filter_input"
              value={selected ?? ''}
              onChange={(e) => setSelected(Number(e.target.value) || null)}
            >
              <option value="">Length of Service</option>
              {options.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} years
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-4">
        <CustomButton
          title="Apply Filter"
          btnType="button"
          containerStyles="app__btn_green"
          handleClick={handleApply}
        />

        <CustomButton
          title="Clear Filter"
          btnType="button"
          containerStyles="app__btn_gray"
          handleClick={handleClear}
        />
      </div>
    </div>
  )
}

export default LoyaltyFilter
