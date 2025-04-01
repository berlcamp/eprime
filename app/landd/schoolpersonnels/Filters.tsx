import { CustomButton } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import { CoordinatorshipTypes, MajorTypes, SubjectTypes } from '@/types'
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/20/solid'

import React, { useEffect, useState } from 'react'

interface FilterTypes {
  setFilterKeyword: (keyword: string) => void
}

const Filters = ({ setFilterKeyword }: FilterTypes) => {
  const [keyword, setKeyword] = useState<string>('')
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [selectedCoordinatorship, setSelectedCoordinatorship] = useState('')

  const [subjects, setSubjects] = useState<SubjectTypes[] | []>([])
  const [coordinatorships, setCoordinatorships] = useState<
    CoordinatorshipTypes[] | []
  >([])
  const [majors, setMajors] = useState<MajorTypes[] | []>([])

  const { supabase } = useSupabase()
  const handleApply = () => {
    if (keyword.trim() === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
  }

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('hrm_subjects').select()
      if (data) {
        setSubjects(data)
      }
    }

    const fetchCoordinatorships = async () => {
      const { data } = await supabase.from('hrm_coordinatorships').select()
      if (data) {
        setCoordinatorships(data)
      }
    }
    const fetchMajors = async () => {
      const { data } = await supabase.from('hrm_majors').select()
      if (data) {
        setMajors(data)
      }
    }
    void fetchCoordinatorships()
    void fetchMajors()
    void fetchSubjects()
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
              <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
              <input
                placeholder="Search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="app__filter_input"
              />
            </div>
            <div className="app__filter_container !hidden">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Grade Level</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            <div className="app__filter_container !hidden">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Choose Subject</option>
                {subjects.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.title} - {item.category_level}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container !hidden">
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
            <div className="app__filter_container !hidden">
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
