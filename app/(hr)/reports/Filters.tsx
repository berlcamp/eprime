import { CustomButton } from '@/components/index'
import {
  fetchCoordinatorships,
  fetchPositions,
  fetchSchools
} from '@/utils/fetchApi'
import { TagIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useState } from 'react'

import {
  CoordinatorshipTypes,
  MajorTypes,
  PositionTypes,
  SubjectTypes,
  type SchoolTypes
} from '@/types'

interface FilterTypes {
  subjects: SubjectTypes[]
  majors: MajorTypes[]
  setFilterSchool: (type: string) => void
  setFilterLevel: (type: string) => void
  setFilterMajor: (type: string) => void
  setFilterSubject: (type: string) => void
  setFilterCoodinatorship: (type: string) => void
  setFilterPosition: (type: string) => void
}

const Filters = ({
  subjects,
  majors,
  setFilterSchool,
  setFilterLevel,
  setFilterMajor,
  setFilterSubject,
  setFilterCoodinatorship,
  setFilterPosition
}: FilterTypes) => {
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedCoordinatorship, setSelectedCoordinatorship] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  const [coordinatorships, setCoordinatorships] = useState<
    CoordinatorshipTypes[]
  >([])
  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [positions, setPositions] = useState<PositionTypes[]>([])

  const handleApply = () => {
    if (
      selectedSchool === '' &&
      selectedLevel === '' &&
      selectedMajor === '' &&
      selectedSubject === '' &&
      selectedCoordinatorship === '' &&
      selectedPosition === ''
    )
      return

    // pass filter values to parent
    setFilterSchool(selectedSchool)
    setFilterLevel(selectedLevel)
    setFilterMajor(selectedMajor)
    setFilterSubject(selectedSubject)
    setFilterCoodinatorship(selectedCoordinatorship)
    setFilterPosition(selectedPosition)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (
      selectedSchool === '' &&
      selectedLevel === '' &&
      selectedMajor === '' &&
      selectedSubject === '' &&
      selectedCoordinatorship === '' &&
      selectedPosition === ''
    )
      return

    // pass filter values to parent
    setFilterSchool(selectedSchool)
    setFilterLevel(selectedLevel)
    setFilterMajor(selectedMajor)
    setFilterSubject(selectedSubject)
    setFilterCoodinatorship(selectedCoordinatorship)
    setFilterPosition(selectedPosition)
  }

  // clear all filters
  const handleClear = () => {
    setFilterSchool('')
    setFilterLevel('')
    setFilterMajor('')
    setFilterSubject('')
    setFilterCoodinatorship('')
    setFilterPosition('')

    // local state
    setSelectedSchool('')
    setSelectedLevel('')
    setSelectedMajor('')
    setSelectedSubject('')
    setSelectedCoordinatorship('')
    setSelectedPosition('')
  }

  // Featch data
  useEffect(() => {
    const fetchSchoolsData = async () => {
      const result = await fetchSchools({}, 999, 0)
      setSchools(result.data.length > 0 ? result.data : [])
    }

    const fetchCoordinatorshipsData = async () => {
      const result = await fetchCoordinatorships(999, 0)
      setCoordinatorships(result.data.length > 0 ? result.data : [])
    }

    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 999, 0)
      setPositions(result.data && result.data.length > 0 ? result.data : [])
    }

    void fetchSchoolsData()
    void fetchCoordinatorshipsData()
    void fetchPositionsData()
  }, [])

  return (
    <div className="">
      <div className="items-center space-y-1">
        <form
          onSubmit={handleSubmit}
          className="items-center app__filter_field_container"
        >
          <div className="items-center space-y-1">
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose School</option>
                {schools.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Level</option>
                <option value="Elementary">Elementary</option>
                <option value="Junior Highschool">Junior Highschool</option>
                <option value="Senior Highschool">Senior Highschool</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Major</option>
                {majors.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Subject</option>
                {subjects.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedCoordinatorship}
                onChange={(e) => setSelectedCoordinatorship(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Coordinatorship</option>
                {coordinatorships.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Position</option>
                {positions.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
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
