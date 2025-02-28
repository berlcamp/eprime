'use client'
import { TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { RankingTypes } from '@/types'
import { format, isAfter, isEqual, parseISO, startOfDay } from 'date-fns'
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

  const isDateInPast = (dateString: string) => {
    if (!dateString) {
      return false // Treat invalid dates as not in the past
    }

    const inputDate = startOfDay(parseISO(dateString))
    const today = startOfDay(new Date())

    return isAfter(inputDate, today) || isEqual(inputDate, today)
  }

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
                  <div className="pt-2">
                    Deadline:{' '}
                    {format(
                      new Date(item.display_on_portal_until),
                      'MMMM d, yyyy'
                    )}
                  </div>
                  <div className="pt-2">Minimum CSC Requirements:</div>
                  <div className="font-semibold">1. Education</div>
                  <div className="pl-6">{item.ier_education_description}</div>
                  <div className="font-semibold">2. Experience</div>
                  <div className="pl-6">{item.ier_experience_description}</div>
                  <div className="font-semibold">3. Training</div>
                  <div className="pl-6">{item.ier_training_description}</div>
                  <div className="font-semibold">4. Eligibility</div>
                  <div className="pl-6">{item.ier_eligibility_description}</div>

                  <div className="pt-2 space-x-2">
                    {item.display_ier && (
                      <Link
                        href={`/rankingapplicantresults/ier?ref=${item.id}`}
                        className="app__btn_blue"
                      >
                        Initial Evaluation Result
                      </Link>
                    )}
                    {item.status === 'Open' &&
                    isDateInPast(item.display_on_portal_until) ? (
                      <Link
                        href={`/apply?ref=${item.id}`}
                        className="app__btn_green"
                      >
                        Apply Now
                      </Link>
                    ) : (
                      <div className="mt-4">
                        <span className="app__status_container_orange text-xs!">
                          Application for this Ranking is already closed
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    {item.status === 'Closed' && (
                      <span className="text-gray-600 italic">
                        The application for this ranking is already Closed
                      </span>
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
