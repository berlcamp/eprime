'use client'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  CompetencyItemTypes,
  CompetencyTypes,
  IpcrfTypes
} from '@/types/pmsTypes'
import React, { useEffect, useState } from 'react'
import uuid from 'react-uuid'
import CompentencyRatingRow from './CompentencyRatingRow'

interface ModalProps {
  ipcrfId: string
  competencyType: string
  editData: IpcrfTypes
  view: string
  hideRatingModal: () => void
}

export default function CompetenciesRatingsModal({
  ipcrfId,
  editData,
  competencyType,
  view,
  hideRatingModal
}: ModalProps) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()

  const [saving, setSaving] = useState(false)
  const [competencies, setCompetencies] = useState<CompetencyTypes[]>([])

  const fetchData = async () => {
    const { data } = await supabase
      .from('ipcrfs')
      .select('competencies')
      .eq('id', ipcrfId)
      .limit(1)
      .maybeSingle()

    if (data) {
      setCompetencies(data.competencies)
    }
  }

  const handleUpdateRating = (updatedItem: CompetencyItemTypes) => {
    const updatedCompetencies = competencies.map((competency) => {
      const updatedItems = competency.competency_items.map((item) => {
        if (item.id === updatedItem.id) {
          return updatedItem
        } else {
          return item
        }
      })

      return { ...competency, competency_items: updatedItems }
    })
    setCompetencies(updatedCompetencies)
  }

  const handleSave = async () => {
    setSaving(true)

    const { error } = await supabase
      .from('ipcrfs')
      .update({
        competencies
      })
      .eq('id', ipcrfId)

    if (!error) {
      setSaving(false)
      setToast('success', 'Successfully saved.')
      hideRatingModal()
    }
  }

  const getTotalScore = () => {
    let counter = 0
    let subTotal = 0
    competencies.forEach((competency) => {
      competency.competency_items.forEach((item) => {
        if (item.rating && item.rating !== '') {
          subTotal += Number(item.rating)
          counter++
        }
      })
    })

    const total = subTotal / counter

    return Number(total.toFixed(3))
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
    void fetchData() // Fetch data on first load only
  }, [])

  return (
    <div className="z-50 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
        <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
          <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
            <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
              CORE BEHAVIORAL COMPETENCIES
            </h5>
            <button
              onClick={hideRatingModal}
              type="button"
              className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline"
            >
              &times;
            </button>
          </div>

          {!competencies && <TwoColTableLoading />}

          {competencies && (
            <div className="modal-body relative p-4 overflow-x-scroll">
              <div
                className={`grid grid-cols-1 gap-4 mt-10 mb-4 ${
                  (!competencies || competencies?.length === 0) && 'hidden'
                }`}
              >
                {competencies?.map((item) => (
                  <React.Fragment key={uuid()}>
                    <div className="text-gray-600 font-medium dark:text-gray-300">
                      {item.title}
                    </div>
                    <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400 mb-4">
                      <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th className="py-2 px-2">Items</th>
                          <th className="py-2 px-2">Ratings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.competency_items?.map((item) => (
                          <CompentencyRatingRow
                            key={uuid()}
                            handleUpdateRating={handleUpdateRating}
                            status={editData.status}
                            view={view}
                            item={item}
                          />
                        ))}
                      </tbody>
                    </table>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-2 my-2">
                <div className="font-bold">Total Competency Score:</div>
                <div className="font-bold text-emerald-700">
                  {getTotalScore()}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 my-2">
                <div className="font-bold">Adjectival Rating:</div>
                <div className="font-bold text-emerald-700">
                  {getAdjectivalRating()}
                </div>
              </div>

              <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                {view !== 'as_approver' && editData.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                  >
                    {saving ? 'Saving..' : 'Save Ratings'}
                  </button>
                )}
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
          )}
        </div>
      </div>
    </div>
  )
}
