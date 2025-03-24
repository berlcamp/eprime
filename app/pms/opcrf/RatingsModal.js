'use client'
import React, { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import uuid from 'react-uuid'
import RatingsRow from './RatingsRow'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useFilter } from '@/context/FilterContext'

export default function Ratings ({ opcrfId, editData, view, allCompetencies, allObjectives, handleUpdateList, hideRatingModal }) {
  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const [saving, setSaving] = useState(false)
  const [objectives, setObjectives] = useState(null)
  const [competencies, setCompetencies] = useState(null)

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('opcrfs')
      .select('objectives, competencies')
      .eq('id', opcrfId)
      .limit(1)
      .single()

    if (error) console.error(error)

    setObjectives(data.objectives)
    setCompetencies(data.competencies)
  }

  const handleUpdateObjectives = (updatedObjective) => {
    const updatedObjectives = objectives.map(item => {
      if (item.id === updatedObjective.id) {
        return {
          ...item,
          quality_rating: updatedObjective.quality_rating,
          efficiency_rating: updatedObjective.efficiency_rating,
          timeliness_rating: updatedObjective.timeliness_rating,
          score: updatedObjective.score
        }
      }
      return item
    })

    setObjectives(updatedObjectives)
  }

  const handleSave = async () => {
    setSaving(true)

    const { error } = await supabase
      .from('opcrfs')
      .update({
        objectives,
        competencies,
        score: getTotalScore(),
        adjectival_rating: getAdjectivalRating()
      })
      .eq('id', opcrfId)

    if (!error) {
      const updatedData = {
        score: getTotalScore(),
        adjectival_rating: getAdjectivalRating(),
        id: editData.id
      }
      handleUpdateList(updatedData) // Update list on main page

      setToast('success', 'Successfully saved.')
      setSaving(false)
      hideRatingModal()
    }
  }

  const getTotalScore = () => {
    const total = objectives.reduce((accumulator, item) => {
      return accumulator + Number(item.score)
    }, 0)

    if (!isNaN(total)) {
      return Number(total.toFixed(3))
    } else {
      return 'N/A'
    }
  }

  const getAdjectivalRating = () => {
    const rating = getTotalScore()
    if (rating <= 1.499) {
      return 'Poor'
    }
    if (rating <= 2.499) {
      return 'Unsatisfactory'
    }
    if (rating <= 3.499) {
      return 'Satisfactory'
    }
    if (rating <= 4.499) {
      return 'Very Satisfactory'
    }
    if (rating <= 5) {
      return 'Outstanding'
    }
    return 'N/A'
  }

  useEffect(() => {
    fetchData() // Fetch data on first load only
  }, [])

  return (
      <div className="z-50 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                OPCRF Ratings
              </h5>
              <button onClick={hideRatingModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            { !objectives && <TwoColTableLoading/> }

            { objectives &&

              <div className="modal-body relative p-4 overflow-x-scroll">
                <div className='grid grid-cols-1 gap-4 mt-4'>
                  <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                            <th className="py-2 px-2">KRA</th>
                            <th className="py-2 px-2">Objective</th>
                            <th className="py-2 px-2 text-center">Weight</th>
                            <th className="py-2 px-2 text-center">Q</th>
                            <th className="py-2 px-2 text-center">E</th>
                            <th className="py-2 px-2 text-center">T</th>
                            <th className="py-2 px-2 text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                      {
                        objectives?.map((item) => (
                          <RatingsRow
                            status={editData.status}
                            view={view}
                            updateObjectives={handleUpdateObjectives}
                            allObjectives={allObjectives}
                            key={uuid()}
                            item={item}/>
                        ))
                      }
                    </tbody>
                </table>
                </div>

                <div className='flex items-center justify-end space-x-2 my-2'>
                  <div className='font-bold'>Total Score:</div>
                  <div className='font-bold text-emerald-700'>{ objectives && getTotalScore() }</div>
                </div>
                <div className='flex items-center justify-end space-x-2 my-2'>
                  <div className='font-bold'>Adjectival Rating:</div>
                  <div className='font-bold text-emerald-700'>{ objectives && getAdjectivalRating() }</div>
                </div>
                <div className='flex items-center justify-end space-x-2 my-2'>
                  <div className='font-bold'>Status:</div>
                  <div className='font-bold text-emerald-700'>{ editData.status }</div>
                </div>

                <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                      {
                        (view !== 'as_approver' && editData.status !== 'Approved') &&
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                          >
                            {saving ? 'Saving..' : 'Save Ratings'}
                          </button>
                      }
                      <button
                        type="button"
                        onClick={hideRatingModal}
                        disabled={saving}
                        className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                      >
                        Close
                      </button>
                </div>
              </div>

            }

          </div>
        </div>
      </div>

  )
}
