'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes } from '@/types'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'
import { use, useEffect, useState } from 'react'
import { IesAttachment } from './IesAttachment'

export default function Page({
  params
}: {
  params: Promise<{ applicantid: string }>
}) {
  const { applicantid: applicantId } = use(params)
  const [downloading, setDownloading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const { supabase } = useSupabase()

  useEffect(() => {
    const verifyAndDownload = async () => {
      // Step 1: Fetch basic applicant info (birthday and age)
      const { data: applicantData, error: fetchError } = await supabase
        .from('hrm_ranking_applicants')
        .select('id, email, age')
        .eq('id', applicantId)
        .maybeSingle()

      if (fetchError || !applicantData) {
        setError('Failed to fetch applicant data.')
        setVerifying(false)
        return
      }

      // Step 2: Prompt for password
      const expectedPassword = `${applicantData.email}_${applicantData.age}`

      const userPassword = prompt(
        'Enter password to download attachments.\nFormat: EMAIL_AGE\nNote: the AGE must be your age during your application'
      )

      if (userPassword !== expectedPassword) {
        setError('Incorrect password.')
        setVerifying(false)
        return
      }

      setDownloading(true)

      // Step 3: Fetch full applicant data
      const { data, error: fullFetchError } = await supabase
        .from('hrm_ranking_applicants')
        .select(
          '*,ranking:ranking_id(type,year,department,status,position:position_id(*),chairman_id,criterias:hrm_ranking_criterias(*),committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))'
        )
        .eq('id', applicantId)
        .maybeSingle()

      if (!data || fullFetchError) {
        setError('Failed to load applicant ranking data.')
        setVerifying(false)
        return
      }

      const applicant: ApplicantTypes = data
      const accumulatedPoints: Record<string, number> | null =
        CommitteeAccumulatedPoints(applicant.id, applicant.ranking.committees)

      const finalData = {
        applicant,
        ranking: applicant.ranking,
        accumulated_points: accumulatedPoints,
        overall_score: accumulatedPoints
          ? Object.values(accumulatedPoints)
              .reduce((sum: number, points) => sum + points, 0)
              .toFixed(3)
          : ''
      }

      await IesAttachment(finalData)

      setDownloading(false)
      setVerifying(false)
    }

    void verifyAndDownload()
  }, [])

  return (
    <div className="bg-gray-800 h-screen py-20 text-white text-center">
      <div className="bg-white text-black mx-auto w-1/2 rounded-sm py-6 px-4">
        {verifying && !error && <p>Verifying access...</p>}
        {error && <p className="text-red-500 font-semibold">{error}</p>}
        {!verifying && !downloading && !error && <p>Download completed.</p>}
      </div>
    </div>
  )
}
