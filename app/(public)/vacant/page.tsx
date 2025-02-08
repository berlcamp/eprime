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
        .eq('display_on_portal', true)

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
          <div className="app__single_page_title">Vacant Items</div>
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
                  <div>
                    {item.status === 'Closed' && (
                      <span className="text-gray-600 italic">
                        The application for this ranking is already Closed
                      </span>
                    )}
                  </div>
                  <div className="pt-2 space-x-2">
                    {item.status === 'Open' &&
                    item.display_on_portal_until &&
                    new Date(item.display_on_portal_until) > new Date() ? (
                      <Link
                        href={`/apply?ref=${item.id}`}
                        className="app__btn_green"
                      >
                        Apply Now
                      </Link>
                    ) : (
                      <div className="italic">
                        Application for this Ranking is already closed
                      </div>
                    )}
                    {item.display_ier && (
                      <Link
                        href={`/rankingapplicantresults/ier?ref=${item.id}`}
                        className="app__btn_blue"
                      >
                        Initial Evaluation Result
                      </Link>
                    )}
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
