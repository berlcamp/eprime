import React, { useEffect, useState } from 'react'
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/20/solid'
import { CustomButton } from '@/components'
import { fetchOffices, fetchSchools } from '@/utils/fetchApi'

import { type Office, type SchoolTypes } from '@/types'

interface FilterTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterSchool: (type: string) => void
  setFilterOffice: (type: string) => void
}

const Filters = ({ setFilterKeyword, setFilterSchool, setFilterOffice }: FilterTypes) => {
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [keyword, setKeyword] = useState<string>('')
  const [schools, setSchools] = useState<SchoolTypes[]>([])
  const [offices, setOffices] = useState<Office[]>([])

  const handleApply = () => {
    if (keyword.trim() === '' && selectedSchool !== '' && selectedOffice !== '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterSchool(selectedSchool)
    setFilterOffice(selectedOffice)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '' && selectedSchool !== '' && selectedOffice !== '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterSchool(selectedSchool)
    setFilterOffice(selectedOffice)
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
    setFilterSchool('')
    setSelectedSchool('')
    setFilterOffice('')
    setSelectedOffice('')
  }

  // Featch data
  useEffect(() => {
    const fetchSchoolsData = async () => {
      const result = await fetchSchools({}, 300, 0)
      setSchools(result.data.length > 0 ? result.data : [])
    }
    const fetchOfficesData = async () => {
      const result = await fetchOffices('', 300, 0)
      setOffices(result.data.length > 0 ? result.data : [])
    }
    void fetchSchoolsData()
    void fetchOfficesData()
  }, [])

  return (
    <div className=''>
      <div className='items-center space-y-1'>
        <form onSubmit={handleSubmit} className='items-center app__filter_field_container'>
          <div className='items-center space-y-1'>
            <div className='app__filter_container'>
              <MagnifyingGlassIcon className="w-4 h-4 mr-1"/>
              <input
                placeholder='Search'
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="app__filter_input"/>
            </div>
            <div className='app__filter_container'>
              <TagIcon className="w-4 h-4 mr-1"/>
              <select
                value={selectedSchool}
                onChange={e => setSelectedSchool(e.target.value)}
                className='app__filter_select'>
                  <option value=''>Choose School</option>
                  {
                    schools.map((item, index) => (
                      <option key={index} value={item.id}>{item.name}</option>
                    ))
                  }
              </select>
            </div>
            <div className='app__filter_container'>
              <TagIcon className="w-4 h-4 mr-1"/>
              <select
                value={selectedOffice}
                onChange={e => setSelectedOffice(e.target.value)}
                className='app__filter_select'>
                  <option value=''>Choose Office</option>
                  {
                    offices.map((item, index) => (
                      <option key={index} value={item.id}>{item.name}</option>
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
