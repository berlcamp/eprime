'use client'

import {
  CustomButton,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { RankingTypes } from '@/types'

import RspSidebar from '@/components/Sidebars/RspSidebar'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  resolveTurnaroundStages,
  totalTurnaroundDays,
  type ResolvedStage
} from '@/utils/turnaroundTime'
import { format } from 'date-fns'
import { PencilIcon } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { PrintTurnaroundTime } from './PrintTurnaroundTime'
import StageDatesModal from './StageDatesModal'

const formatDate = (date: Date | null) =>
  date ? format(date, 'MMM d, yyyy') : '—'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [refetch, setRefetch] = useState(false)

  const [filterRanking, setFilterRanking] = useState<string>('')
  const [ranking, setRanking] = useState<RankingTypes | null>(null)
  const [stages, setStages] = useState<ResolvedStage[]>([])
  const [selectedStage, setSelectedStage] = useState<ResolvedStage | null>(null)

  const { hasAccess } = useFilter()
  const { supabase } = useSupabase()

  const componentRef = React.useRef(null)
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Ranking Turnaround Time'
  })

  const fetchData = async () => {
    if (filterRanking === '') {
      setRanking(null)
      setStages([])
      return
    }

    setLoading(true)

    try {
      const { data: rankingData, error } = await supabase
        .from('hrm_rankings')
        .select('*, position:position_id(name)')
        .eq('id', filterRanking)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // The applicants carry three of the nine stages between them: when they
      // applied, when HR evaluated them, and when they were appointed.
      const { data: applicants } = await supabase
        .from('hrm_ranking_applicants')
        .select('id, created_at, evaluated_at, appointed_at')
        .eq('ranking_id', filterRanking)

      const applicantIds = (applicants ?? []).map((a: any) => a.id)

      // Deliberation is bounded by when the committees cast their points.
      let points: any[] = []
      if (applicantIds.length > 0) {
        const { data: pointsData } = await supabase
          .from('hrm_ranking_applicant_points')
          .select('created_at, updated_at')
          .in('applicant_id', applicantIds)
        points = pointsData ?? []
      }

      const { data: overrideRows } = await supabase
        .from('hrm_ranking_stage_dates')
        .select('*')
        .eq('ranking_id', filterRanking)

      const overrides: Record<string, any> = {}
      ;(overrideRows ?? []).forEach((row: any) => {
        overrides[row.stage_key] = {
          date_from: row.date_from,
          date_to: row.date_to
        }
      })

      setRanking(rankingData)
      setStages(
        resolveTurnaroundStages({
          displayOnPortalFrom: rankingData.display_on_portal_from,
          displayOnPortalUntil: rankingData.display_on_portal_until,
          ierPostedAt: rankingData.ier_posted_at,
          ranklistPostedAt: rankingData.ranklist_posted_at,
          rqaPostedAt: rankingData.rqa_posted_at,
          closedAt: rankingData.closed_at,
          applicationDates: (applicants ?? []).map((a: any) => a.created_at),
          evaluationDates: (applicants ?? []).map((a: any) => a.evaluated_at),
          appointmentDates: (applicants ?? []).map((a: any) => a.appointed_at),
          deliberationStartDates: points.map((p: any) => p.created_at),
          deliberationEndDates: points.map((p: any) => p.updated_at),
          overrides
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data
  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRanking, refetch])

  const totalDays = totalTurnaroundDays(stages)

  // Check access from permission settings or Super Admins
  if (!hasAccess('rsp_manager')) return <Unauthorized />

  return (
    <>
      <Sidebar>
        <RspSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Ranking Turnaround Time" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterRanking={setFilterRanking} />
          </div>

          {filterRanking === '' && (
            <div className="mt-10 text-center text-xl font-light text-gray-600">
              Choose ranking from filters above.
            </div>
          )}

          {ranking && (
            <div className="flex items-center space-x-2 py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500">
              <div className="flex-1 text-xs">
                {ranking.position?.name} - {ranking.type} - {ranking.year}
              </div>
              <div className="app__filter_container">
                <div className="text-xs">
                  Total Turnaround Time:{' '}
                  <span className="font-bold">
                    {totalDays === null ? '—' : `${totalDays} day(s)`}
                  </span>
                </div>
              </div>
              <CustomButton
                containerStyles="app__btn_blue"
                title="Print"
                btnType="button"
                handleClick={() => printFn()}
              />
            </div>
          )}

          {/* Main Content */}
          {ranking && (
            <div>
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th pl-4 w-10"></th>
                    <th className="app__th">Stage</th>
                    <th className="app__th w-40">Start</th>
                    <th className="app__th w-40">End</th>
                    <th className="app__th w-28">Days</th>
                    <th className="app__th w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    stages.map((stage, index) => (
                      <tr key={stage.key} className="app__tr">
                        <td className="app__td pl-4">{index + 1}.</td>
                        <th className="app__th_firstcol">
                          <div className="font-medium">{stage.label}</div>
                          <div className="font-light text-xs text-gray-500">
                            {stage.isManual
                              ? 'Manually entered'
                              : stage.source}
                          </div>
                        </th>
                        <td className="app__td">{formatDate(stage.from)}</td>
                        <td className="app__td">
                          {formatDate(stage.to)}
                          {stage.toIsInferred && (
                            <div className="text-xs text-gray-500">
                              until the next stage
                            </div>
                          )}
                        </td>
                        <td className="app__td">
                          {stage.days === null ? (
                            '—'
                          ) : (
                            <span className="font-bold">{stage.days}</span>
                          )}
                        </td>
                        <td className="app__td">
                          <div
                            onClick={() => setSelectedStage(stage)}
                            className="flex items-center space-x-1 cursor-pointer text-blue-600 hover:underline"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span className="text-xs">Edit</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {loading && <TableRowLoading cols={6} rows={3} />}
                </tbody>
              </table>

              <div className="px-4 py-3 text-xs text-gray-500 space-y-1">
                <div>
                  Days are counted inclusively — a stage that starts and ends on
                  the same day counts as 1 day.
                </div>
                <div>
                  Stages recorded as a single milestone (the postings and the
                  closing) are counted up to the start of the next stage. Edit a
                  stage to enter the actual dates.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Container */}
      {ranking && (
        <PrintTurnaroundTime
          ranking={ranking}
          stages={stages}
          totalDays={totalDays}
          ref={componentRef}
        />
      )}

      {/* Edit stage dates modal */}
      {selectedStage && (
        <StageDatesModal
          rankingId={filterRanking}
          stage={selectedStage}
          hideModal={() => setSelectedStage(null)}
          refetch={() => setRefetch(!refetch)}
        />
      )}
    </>
  )
}
export default Page
