import { type NextRequest, NextResponse } from 'next/server'

import { IesTemplate } from '@/components/Emails/IesTemplate'
import { ApplicantTypes } from '@/types'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'
import { createClient } from '@supabase/supabase-js'
import { getResend } from '@/lib/resend'
import type * as React from 'react'

interface RequestParamTypes {
  applicant: ApplicantTypes
  email: string
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const params: RequestParamTypes = await req.json()

  try {
    const resend = getResend()
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    const { data } = await supabase
      .from('hrm_ranking_applicants')
      .select(
        '*,ranking:ranking_id(type,year,department,status,position:position_id(*),chairman_id,criterias:hrm_ranking_criterias(*),committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
        {
          count: 'exact'
        }
      )
      .eq('id', params.applicant.id)
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

      const { error } = await resend.emails.send({
        from: 'DepEd Bayugan (No-reply) <noreply@sortbrite.com>',
        to: [params.email],
        subject: 'Individual Evaluation Sheet',
        react: IesTemplate({ applicantData }) as React.ReactElement
      })

      if (error) {
        return NextResponse.json({ error })
      }
    }
    return NextResponse.json({ message: 'Successfully sent' })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error })
  }
}
