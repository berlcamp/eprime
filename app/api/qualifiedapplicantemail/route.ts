import { type NextRequest, NextResponse } from 'next/server'

import { RankingApplicantTemplate } from '@/components/Emails/RankingApplicantTemplate'
import type * as React from 'react'
import { Resend } from 'resend'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_KEY)

interface RequestParamTypes {
  position: string
  email: string
  code: string
  firstname: string
  middlename: string
  lastname: string
}

export async function POST(req: NextRequest) {
  try {
    const params: RequestParamTypes = await req.json()

    const { error: error2 } = await resend.emails.send({
      from: 'DepEd Bayugan (No-reply) <noreply@sortbrite.com>',
      to: [params.email],
      subject: `Confirmation of Application Submission – [${params.code}]`,
      react: RankingApplicantTemplate({
        position: params.position,
        code: params.code,
        firstname: params.firstname,
        middlename: params.middlename,
        lastname: params.lastname
      }) as React.ReactElement
    })

    if (error2) {
      return NextResponse.json({ error2 })
    }

    return NextResponse.json({ message: 'Successfully sent' })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error })
  }
}
