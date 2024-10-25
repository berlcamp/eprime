'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import { RankingTypes } from '@/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Jobs() {
  const [rankings, setRankings] = useState<RankingTypes[] | []>([])
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchRankins = async () => {
      const { data } = await supabase
        .from('hrm_rankings')
        .select('*, position:position_id(name)')
        .eq('display_on_portal', 'Yes')
        .eq('status', 'Open')

      setRankings(data)
    }
    void fetchRankins()
  }, [])

  return (
    <div className="">
      <h4 className="text-xl font-semibold mb-6">Vacant Items:</h4>
      {rankings.length > 0 &&
        rankings.map((item, index) => (
          <div key={index} className="flex items-start text-sm space-x-4 mb-8">
            <div>{index + 1}.</div>
            <div className="flex flex-col space-y-1">
              <div className="font-bold">{item.position.name}</div>
              <div>{item.description}</div>
              <div className="pt-2">
                <Link href={`/apply?ref=${item.id}`} className="app__btn_green">
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}
