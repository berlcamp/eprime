'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes } from '@/types'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'
import { useEffect, useState } from 'react'
import { IesAttachment } from './IesAttachment'

export default function Page({ params }: { params: { applicantid: string } }) {
  //
  const applicantId = params.applicantid
  const [downloading, setDownloading] = useState(true)

  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchApplicantData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_applicants')
        .select(
          '*,ranking:ranking_id(type,year,department,status,position:position_id(*),chairman_id,criterias:hrm_ranking_criterias(*),committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
          {
            count: 'exact'
          }
        )
        .eq('id', applicantId)
        .maybeSingle()

      if (data) {
        const d: ApplicantTypes = data
        const accumulatedPoints: Record<string, number> | null =
          CommitteeAccumulatedPoints(d.id, d.ranking.committees)

        const applicantData = {
          applicant: d,
          ranking: d.ranking,
          accumulated_points: accumulatedPoints,
          overall_score: accumulatedPoints
            ? Object.values(accumulatedPoints)
                .reduce((sum: number, points) => sum + points, 0)
                .toFixed(3)
            : ''
        }
        void IesAttachment(applicantData)
      }
      setDownloading(false)
    }
    void fetchApplicantData()
  }, [])

  if (downloading)
    return (
      <div className="bg-gray-800 h-screen py-20">
        <div className="bg-white mx-auto w-1/2 rounded-sm text-center py-4">
          Downloading...
        </div>
      </div>
    )
  if (!downloading)
    return (
      <div className="bg-gray-800 h-screen py-20">
        <div className="bg-white mx-auto w-1/2 rounded-sm text-center py-4">
          Downloaded
        </div>
      </div>
    )
}
