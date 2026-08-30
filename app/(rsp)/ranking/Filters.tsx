import { CustomButton } from '@/components/index'
import { fetchPositions } from '@/utils/fetchApi'
import { TagIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useState } from 'react'

import type { PositionTypes } from '@/types'

interface FilterTypes {
  setFilterStatus: (status: string) => void
  setFilterPosition: (type: string) => void
}

const Filters = ({ setFilterStatus, setFilterPosition }: FilterTypes) => {
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [positions, setPositions] = useState<PositionTypes[]>([])

  const handleApply = () => {
    if (selectedPosition === '' && selectedStatus === '') return

    // pass filter values to parent
    setFilterStatus(selectedStatus)
    setFilterPosition(selectedPosition)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedPosition === '' && selectedStatus === '') return

    // pass filter values to parent
    setFilterStatus(selectedStatus)
    setFilterPosition(selectedPosition)
  }

  // clear all filters
  const handleClear = () => {
    setSelectedStatus('')
    setFilterStatus('')
    setFilterPosition('')
    setSelectedPosition('')
  }

  // Featch data
  useEffect(() => {
    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 3000, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }
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
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="app__filter_select"
              >
                <option value="">All Position</option>
                {positions.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="app__filter_select"
              >
                <option value="">All Status</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
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
