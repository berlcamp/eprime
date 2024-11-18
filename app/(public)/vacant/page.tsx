'use client'
import { TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { RankingTypes } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const Page: React.FC = () => {
  const [rankings, setRankings] = useState<RankingTypes[] | []>([])
  const [loading, setLoading] = useState(false)
  const { supabase, session } = useSupabase()

  useEffect(() => {
    setLoading(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const fetchRankins = async () => {
      const { data } = await supabase
        .from('hrm_rankings')
        .select('*, position:position_id(name)')
        .eq('display_on_portal', 'Yes')
        .gte('display_on_portal_until', today)
        .eq('status', 'Open')

      setRankings(data)
      setLoading(false)
    }
    void fetchRankins()
  }, [])

  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="bg-gray-700 h-full pb-10 pt-32 px-6 flex items-start justify-center">
        <div className="bg-gray-100 p-4 mb-20 rounded-lg border w-full md:w-[720px]">
          <div className="px-4 text-lg text-center uppercase font-semibold text-gray-700">
            Vacant Items
          </div>
          {loading && <TwoColTableLoading />}
          {rankings.length > 0 &&
            rankings.map((item, index) => (
              <div
                key={index}
                className="flex items-start text-sm space-x-4 mb-8"
              >
                <div>{index + 1}.</div>
                <div className="flex flex-col space-y-1">
                  <div className="font-bold">{item.position?.name}</div>
                  <div>{item.description}</div>
                  <div className="pt-2">
                    <Link
                      href={`/apply?ref=${item.id}`}
                      className="app__btn_green"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}
export default Page
