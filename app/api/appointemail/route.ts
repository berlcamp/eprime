import { type NextRequest, NextResponse } from 'next/server'

import { RankingAppointmentTemplate } from '@/components/Emails/RankingAppointmentTemplate'
import { getResend } from '@/lib/resend'
import type * as React from 'react'

interface RequestParamTypes {
  position: string
  type: string
  email: string
  code: string
  firstname: string
  middlename: string
  lastname: string
}

export async function POST(req: NextRequest) {
  try {
    const params: RequestParamTypes = await req.json()

    const resend = getResend()
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    const { error: error2 } = await resend.emails.send({
      from: 'DepEd Bayugan (No-reply) <noreply@sortbrite.com>',
      to: [params.email],
      subject: 'Congratulations on Your Appointment!',
      react: RankingAppointmentTemplate({
        position: params.position,
        type: params.type,
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
