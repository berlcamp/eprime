'use client'
import { TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { RankingTypes } from '@/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const Page: React.FC = () => {
  const [rankings, setRankings] = useState<RankingTypes[] | []>([])
  const [loading, setLoading] = useState(false)
  const { supabase, session } = useSupabase()

  useEffect(() => {
    setLoading(true)
    const fetchRankins = async () => {
      const { data } = await supabase
        .from('hrm_rankings')
        .select('*, position:position_id(name)')
        .eq('status', 'Closed')

      setRankings(data)
      setLoading(false)
    }
    void fetchRankins()
  }, [])

  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="app__single_page_wrapper1">
        <div className="app__single_page_wrapper2">
          <div className="app__single_page_title">Ranking Results</div>
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
                  <div className="pt-2 space-x-2">
                    <Link href="#" className="app__btn_blue">
                      Rank List
                    </Link>
                    <Link href="#" className="app__btn_blue">
                      IER
                    </Link>
                    <Link href="#" className="app__btn_blue">
                      Notice of Appointment Issued
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
