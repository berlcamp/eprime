'use client'

import {
  TableRowLoading,
  TopBarDark,
  TwoColTableLoading
} from '@/components/index'
import React, { useEffect, useState } from 'react'

// Types
import type { ApplicantTypes, RankingTypes } from '@/types'

import Footer from '@/components/Footer'
import { useSupabase } from '@/context/SupabaseProvider'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'
import { useSearchParams } from 'next/navigation'

interface ListTypes {
  applicant: ApplicantTypes
  accumulated_points: Record<string, number> | null
  overall_score: string
}

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const [list, setList] = useState<ListTypes[]>([])
  const [rankList, setRankList] = useState<ListTypes[]>([])

  const { supabase, session } = useSupabase()

  const [rankingDetails, setRankingDetails] = useState<RankingTypes | null>(
    null
  )

  const searchParams = useSearchParams()
  const rankingId = searchParams.get('ref')

  const fetchData = async () => {
    setLoading(true)

    console.log('rankingId', rankingId)

    try {
      const { data, error } = await supabase
        .from('hrm_ranking_applicants')
        .select(
          '*, applicant_documents:hrm_ranking_applicant_documents(status),ranking:ranking_id(type,year,passing_score,position:position_id(name),committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
          {
            count: 'exact'
          }
        )
        .eq('ranking_id', rankingId)

      if (error) {
        throw new Error(error.message)
      }

      if (data.length > 0) {
        const structguredData: ListTypes[] = []
        data.forEach((d: ApplicantTypes) => {
          const accumulatedPoints: Record<string, number> | null =
            CommitteeAccumulatedPoints(d.id, d.ranking.committees)

          structguredData.push({
            applicant: d,
            accumulated_points: accumulatedPoints,
            overall_score: accumulatedPoints
              ? Object.values(accumulatedPoints)
                  .reduce((sum: number, points) => sum + points, 0)
                  .toFixed(2)
              : ''
          })
        })

        // Sort structguredData by overall_score in descending order
        structguredData.sort((a, b) => {
          const scoreA = parseFloat(a.overall_score || '0')
          const scoreB = parseFloat(b.overall_score || '0')
          return scoreB - scoreA // Sort in descending order
        })

        setList(structguredData)
        setRankList(structguredData)

        // get the ranking details so we can use the passing score
        setRankingDetails(structguredData[0].applicant.ranking)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data
  useEffect(() => {
    setList([])
    setRankList([])
    void fetchData()
  }, [])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="app__single_page_wrapper1">
        <div className="app__single_page_wrapper2">
          <div className="app__single_page_title">
            <div>IER</div>
            <div className="text-xs">
              {rankingDetails?.position?.name} - {rankingDetails?.year}
            </div>
          </div>
          <div className="text-xs italic text-center text-gray-600">
            (The official initial evaluation results will be sent via email once
            the evaluation period is complete. )
          </div>
          {loading && <TwoColTableLoading />}
          {/* Main Content */}
          {rankList.length > 0 && (
            <div className="mt-4">
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">#</th>
                    <th className="app__th">Application Code</th>
                    <th className="app__th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!isDataEmpty &&
                    list.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">{index + 1}.</td>
                        <th className="app__th_firstcol">
                          <div className="font-medium">
                            {item.applicant.code}
                          </div>
                        </th>
                        <td className="app__td">
                          <div>
                            {item.applicant.evaluation_status ===
                              'For Evaluation' && (
                              <span className="text-orange-500 bg-orange-100 border border-orange-500 py-px px-1">
                                For Evaluation
                              </span>
                            )}
                            {item.applicant.evaluation_status ===
                              'Qualified' && (
                              <span className="text-green-500 bg-green-100 border border-green-500 py-px px-1">
                                Qualified
                              </span>
                            )}
                            {item.applicant.evaluation_status ===
                              'Disqualified' && (
                              <span className="text-red-500 bg-red-100 border border-red-500 py-px px-1">
                                Disqualified
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {loading && <TableRowLoading cols={2} rows={2} />}
                </tbody>
              </table>
              {!loading && isDataEmpty && (
                <div className="app__norecordsfound">No results.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
export default Page
