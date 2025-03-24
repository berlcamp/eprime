import { useFilter } from '@/context/FilterContext'
import React from 'react'

export default function Filters ({ handleSubmitFilter, handleClearFilters }) {
  const { filters, setFilters } = useFilter()
  return (
    <>
      <input
          onChange={e => setFilters({ ...filters, ...{ searchOpcrfTemplate: e.target.value } })}
          value={typeof filters.searchOpcrfTemplate !== 'undefined' ? filters.searchOpcrfTemplate : '' }
          placeholder='Search Title'
          className='inline-flex text-gray-500 border focus:ring-0 focus:outline-none text-xs px-2 py-1 text-left items-center dark:bg-gray-300'/>
      <button
        onClick={handleSubmitFilter}
        className='bg-emerald-500 inline-flex hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm'>
          Apply Filter
      </button>
      <button
        onClick={handleClearFilters}
        className='bg-gray-500 inline-flex hover:bg-gray-600 border border-gray-600 font-bold px-2 py-1 text-xs text-white rounded-sm'>
          Clear Filters
      </button>
    </>
  )
}
