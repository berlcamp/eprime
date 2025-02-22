import { type NextRequest, NextResponse } from 'next/server'

import { DisqualifiedApplicantTemplate } from '@/components/Emails/DisqualifiedApplicantTemplate'
import { QualifiedApplicantTemplate } from '@/components/Emails/QualifiedApplicantTemplate'
import { ApplicantTypes } from '@/types'
import { createClient } from '@supabase/supabase-js'
import type * as React from 'react'
import { Resend } from 'resend'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_KEY)

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

  const { data: ierData } = await supabase
    .from('hrm_ranking_applicant_ier')
    .select()
    .eq('applicant_id', params.applicant.id)

  try {
    // If Qualified
    if (params.applicant.evaluation_status === 'Qualified') {
      const { error } = await resend.emails.send({
        from: 'DepEd Bayugan (No-reply) <noreply@sortbrite.com>',
        to: [params.email],
        subject: `Initial Evaluation Result`,
        react: QualifiedApplicantTemplate(
          params.applicant,
          ierData
        ) as React.ReactElement
      })

      if (error) {
        return NextResponse.json({ error })
      }
    }

    // If Disqualified
    if (params.applicant.evaluation_status === 'Disqualified') {
      const { error } = await resend.emails.send({
        from: 'DepEd Bayugan (No-reply) <noreply@sortbrite.com>',
        to: [params.email],
        subject: `Initial Evaluation Result`,
        react: DisqualifiedApplicantTemplate(
          params.applicant,
          ierData
        ) as React.ReactElement
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
