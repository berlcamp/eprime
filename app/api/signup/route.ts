import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { type Employee } from '@/types'

import { logError } from '@/utils/fetchApi'

import { RegisteredTemplate } from '@/components/Emails/RegisteredTemplate'
import type * as React from 'react'
import { Resend } from 'resend'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_KEY)

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const { item }: { item: Employee } = await req.json()

    // Signup to supabase auth system
    const { data: signUpData, error } = await supabase.auth.admin.createUser({
      email: item.email,
      password: item.password,
      email_confirm: true
    })

    if (error) {
      void logError(
        'Signup to supabase auth system on registration approval',
        'auth.users',
        '',
        error.message
      )
      throw new Error(error.message)
    }

    const newUser: any = signUpData

    // Check if exist on registration data before redirecting to main page
    const { error: hrmUserError } = await supabase.from('hrm_users').upsert(
      {
        id: newUser.user.id,
        firstname: item.firstname,
        middlename: item.middlename,
        lastname: item.lastname,
        gender: item.gender,
        assignment: item.assignment,
        school_id: item.school_id ? item.school_id : null,
        district_id: item.district_id ? item.district_id : null,
        office_id: item.office_id ? item.office_id : null,
        org_id: item.org_id,
        email: item.email,
        status: 'Active'
      },
      { onConflict: 'id' }
    )

    if (hrmUserError) {
      void logError(
        'Add user on registration approval',
        'hrm_users',
        '',
        hrmUserError.message
      )
      throw new Error('hrmUserError' + hrmUserError.message)
    }

    // Update registration data
    const { error: updateRegistrationError } = await supabase
      .from('hrm_registrations')
      .delete()
      .eq('id', item.id)

    if (updateRegistrationError) {
      void logError(
        'Delete registration record after approval',
        'hrm_registrations',
        '',
        updateRegistrationError.message
      )
      throw new Error('hrmUserError' + updateRegistrationError.message)
    }

    let leaveCardData
    if (item.gender === 'Male') {
      leaveCardData = [
        {
          type: 'Paternity Leave',
          balance: 7,
          remarks: 'Auto added to system after signup, adjust accordingly',
          user_id: newUser.user.id,
          particulars: 'Paternity Leave Adjustment'
        },
        {
          type: 'Special Privilege Leave',
          balance: 3,
          remarks: 'Auto added to system after signup, adjust accordingly',
          user_id: newUser.user.id,
          particulars: 'Special Privilege Leave Adjustment'
        },
        {
          type: 'Rehabilitation Leave',
          balance: 180,
          remarks: 'Auto added to system after signup, adjust accordingly',
          user_id: newUser.user.id,
          particulars: 'Rehabilitation Leave Adjustment'
        }
      ]
    } else {
      leaveCardData = [
        {
          type: 'Maternity Leave',
          balance: 105,
          remarks: 'Auto added to system after signup, adjust accordingly',
          user_id: newUser.user.id,
          particulars: 'Maternity Leave Adjustment'
        },
        {
          type: 'Special Privilege Leave',
          balance: 3,
          remarks: 'Auto added to system after signup, adjust accordingly',
          user_id: newUser.user.id,
          particulars: 'Special Privilege Leave Adjustment'
        },
        {
          type: 'Rehabilitation Leave',
          balance: 180,
          remarks: 'Auto added to system after signup, adjust accordingly',
          user_id: newUser.user.id,
          particulars: 'Rehabilitation Leave Adjustment'
        },
        {
          type: 'Special Leave Benefits For Women',
          balance: 60,
          remarks: 'Auto added to system after signup, adjust accordingly',
          user_id: newUser.user.id,
          particulars: 'Special Leave Benefits For Women Adjustment'
        }
      ]
    }

    // Generate default leave credit values for all leave types expect SL, VL, COC, SC
    const { error: error3 } = await supabase
      .from('hrm_leave_cards')
      .insert(leaveCardData)

    if (error3) {
      void logError(
        'Auto add leave card record on registration approval',
        'hrm_leave_cards',
        '',
        error3.message
      )
      throw new Error(error3.message)
    }

    const { error: error2 } = await resend.emails.send({
      from: 'DepEd Bayugan (No-reply) <noreply@sortbrite.com>',
      to: [item.email],
      subject: 'PRIME-HRM Registration Approved',
      react: RegisteredTemplate({
        firstname: item.firstname,
        middlename: item.middlename,
        lastname: item.lastname
      }) as React.ReactElement
    })

    if (error2) {
      return NextResponse.json({ error2 })
    }

    return NextResponse.json({ message: 'Successfully approved' })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error })
  }
}
