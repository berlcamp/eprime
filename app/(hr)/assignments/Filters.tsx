import React, { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon, TagIcon } from '@heroicons/react/20/solid'
import { CustomButton } from '@/components'
import { fetchOffices, fetchSchools } from '@/utils/fetchApi'

import { type Office, type SchoolTypes } from '@/types'

interface FilterTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterSchool: (type: string) => void
  setFilterOffice: (type: string) => void
  setFilterStatus: (type: string) => void
}

const statuses = [
  'Active',
  'Revoked'
]

const Filters = ({ setFilterKeyword, setFilterSchool, setFilterOffice, setFilterStatus }: FilterTypes) => {
  const [selectedSchool, setSelectedSchool] = useState<SchoolTypes | []>([])
  const [selectedOffice, setSelectedOffice] = useState<Office | []>([])
  const [selectedStatus, setSelectedStatus] = useState<string | []>([])
  const [keyword, setKeyword] = useState<string>('')
  const [schools, setSchools] = useState<SchoolTypes[]>([])
  const [offices, setOffices] = useState<Office[]>([])

  const handleApply = () => {
    if (keyword.trim() === '' && Array.isArray(selectedSchool) && Array.isArray(selectedOffice) && selectedStatus === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterSchool(Array.isArray(selectedSchool) ? '' : selectedSchool.id)
    setFilterOffice(Array.isArray(selectedOffice) ? '' : selectedOffice.id)
    setFilterStatus(Array.isArray(selectedStatus) ? '' : selectedStatus)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterSchool(Array.isArray(selectedSchool) ? '' : selectedSchool.id)
    setFilterOffice(Array.isArray(selectedOffice) ? '' : selectedOffice.id)
    setFilterStatus(Array.isArray(selectedStatus) ? '' : selectedStatus)
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
    setFilterSchool('')
    setSelectedSchool([])
    setFilterOffice('')
    setSelectedOffice([])
    setFilterStatus('')
    setSelectedStatus([])
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
      <div className='items-center space-x-2 space-y-1'>
        <form onSubmit={handleSubmit} className='items-center inline-flex'>
          <div className='app__filter_container'>
            <MagnifyingGlassIcon className="w-4 h-4 mr-1"/>
            <input
              placeholder='Search Ref Code or Employee'
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="app__filter_input"/>
          </div>
        </form>
        <div className="inline-flex">
          <Listbox value={selectedSchool} onChange={setSelectedSchool}>
            <div className="relative w-60">
              <Listbox.Button className="app__listbox_btn">
                <span><TagIcon className="w-4 h-4 mr-1"/></span>
                <span className="block truncate text-xs">
                School: {Array.isArray(selectedSchool) ? '' : selectedSchool.name}
                </span>
                <span className="app__listbox_icon">
                  <ChevronDownIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="app__listbox_options">
                  {schools.map((item, itemIdx) => (
                    <Listbox.Option
                      key={itemIdx}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                        }`
                      }
                      value={item}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate text-xs ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {item.name}
                          </span>
                          {
                            selected
                              ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                )
                              : null
                          }
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
        <div className="inline-flex">
          <Listbox value={selectedOffice} onChange={setSelectedOffice}>
            <div className="relative w-60">
              <Listbox.Button className="app__listbox_btn">
                <span><TagIcon className="w-4 h-4 mr-1"/></span>
                <span className="block truncate text-xs">
                Office: {Array.isArray(selectedOffice) ? '' : selectedOffice.name}
                </span>
                <span className="app__listbox_icon">
                  <ChevronDownIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="app__listbox_options">
                  {offices.map((item, itemIdx) => (
                    <Listbox.Option
                      key={itemIdx}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                        }`
                      }
                      value={item}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate text-xs ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {item.name}
                          </span>
                          {
                            selected
                              ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                )
                              : null
                          }
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
        <div className="w-60 inline-flex">
          <Listbox value={selectedStatus} onChange={setSelectedStatus}>
            <div className="relative">
              <Listbox.Button className="app__listbox_btn">
                <span><TagIcon className="w-4 h-4 mr-1"/></span>
                <span className="block truncate text-xs">
                Status: {Array.isArray(selectedStatus) ? '' : selectedStatus}
                </span>
                <span className="app__listbox_icon">
                  <ChevronDownIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="app__listbox_options">
                  {statuses.map((item, itemIdx) => (
                    <Listbox.Option
                      key={itemIdx}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                        }`
                      }
                      value={item}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate text-xs ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {item}
                          </span>
                          {
                            selected
                              ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                )
                              : null
                          }
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
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
