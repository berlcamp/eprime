import { CustomButton } from '@/components/index'
import { TagIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useState } from 'react'

import { useSupabase } from '@/context/SupabaseProvider'
import type { RankingTypes } from '@/types'
import { format } from 'date-fns'

interface FilterTypes {
  setFilterRanking: (type: string) => void
}

const Filters = ({ setFilterRanking }: FilterTypes) => {
  const [selectedRanking, setSelectedRanking] = useState('')

  const [rankings, setRankings] = useState<RankingTypes[] | []>([])

  const { supabase } = useSupabase()

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

  // Featch data
  useEffect(() => {
    const fetchRankings = async () => {
      const { data } = await supabase
        .from('hrm_rankings')
        .select(
          '*,position:position_id(name),committees:hrm_ranking_committees(*)'
        )
        .eq('status', 'Closed')
        // Latest closed first; rankings with no recorded closing date (the
        // backfill could not reach every one) fall to the bottom by id.
        .order('closed_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
      if (data) {
        // Filter rankings where majority of committee members have "Confirmed" status
        const filteredRankings = data.filter((ranking: RankingTypes) => {
          const totalMembers = ranking.committees.length
          const confirmedCount = ranking.committees.filter(
            (c) => c.status === 'Confirmed'
          ).length

          return confirmedCount > totalMembers / 2 // Majority check
        })

        setRankings(filteredRankings)
      }
    }

    void fetchRankings()
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
                value={selectedRanking}
                onChange={(e) => setSelectedRanking(e.target.value)}
                className="app__filter_select"
              >
                {rankings.length === 0 && (
                  <option value="">No Closed Rankings Yet</option>
                )}
                {rankings.length > 0 && (
                  <option value="">Choose Ranking</option>
                )}
                {rankings.length > 0 &&
                  rankings.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.position?.name} - {item.type} - {item.year}
                      {item.closed_at &&
                        ` (Closed ${format(
                          new Date(item.closed_at),
                          'MMM d, yyyy'
                        )})`}
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
