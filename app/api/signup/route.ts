import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { type Employee } from '@/types'

import { logError } from '@/utils/fetchApi'

import { RegisteredTemplate } from '@/components/Emails/RegisteredTemplate'
import { leaveCreditTypes } from '@/constants'
import { getResend } from '@/lib/resend'
import type * as React from 'react'

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

    const resend = getResend()
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    // Signup to supabase auth system
    const { data: signUpData, error } = await supabase.auth.admin.createUser({
      email: item.email,
      password: item.password,
      email_confirm: true
    })

    // Resolve the auth user id. If the email already has an account (e.g. a
    // previous approval partially succeeded and left an orphaned auth user),
    // recover it instead of failing so the remaining steps can complete.
    // We intentionally do NOT touch the existing account's password.
    let userId: string | null = signUpData?.user?.id ?? null

    if (error) {
      const alreadyExists =
        (error as any).code === 'email_exists' ||
        error.status === 422 ||
        /already.*(registered|exists)/i.test(error.message)

      if (!alreadyExists) {
        void logError(
          'Signup to supabase auth system on registration approval',
          'auth.users',
          '',
          error.message
        )
        throw new Error(error.message)
      }

      // Look up the existing auth user by email (generateLink returns the user
      // without sending any email or changing credentials).
      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: item.email
        })

      userId = linkData?.user?.id ?? null

      if (linkError || !userId) {
        void logError(
          'Lookup existing auth user on registration approval',
          'auth.users',
          item.email,
          linkError?.message ?? 'Existing user not found'
        )
        throw new Error(
          linkError?.message ??
            'Email already registered but the existing account could not be found.'
        )
      }
    }

    if (!userId) {
      throw new Error('Could not resolve the user account to approve.')
    }

    // Check if exist on registration data before redirecting to main page
    const { error: hrmUserError } = await supabase.from('hrm_users').upsert(
      {
        id: userId,
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

    const currentYear = new Date().getFullYear() // Get the current year
    const nextYear = currentYear + 1 // Add 1 to the current year
    const resetDate = `${nextYear}/01/02`

    const leaveCardData = leaveCreditTypes.map((l) => {
      return {
        type: l.type,
        gender: l.gender,
        position_type: l.position_type,
        date_of_next_reset:
          l.type !== 'Vacation Leave' && l.type !== 'Sick Leave'
            ? resetDate
            : null,
        credits: l.credits,
        user_id: userId
      }
    })

    // Only seed default leave credits if this user has none yet, so recovering
    // an existing account does not create duplicate leave credit rows.
    const { data: existingCredits, error: existingCreditsError } = await supabase
      .from('hrm_leave_credits')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existingCreditsError) {
      void logError(
        'Check existing leave credits on registration approval',
        'hrm_leave_credits',
        '',
        existingCreditsError.message
      )
      throw new Error(existingCreditsError.message)
    }

    if (!existingCredits || existingCredits.length === 0) {
      // Generate default leave credit values for all leave types expect SL, VL, COC, SC
      const { error: error3 } = await supabase
        .from('hrm_leave_credits')
        .insert(leaveCardData)

      if (error3) {
        void logError(
          'Auto add leave card credits on registration approval',
          'hrm_leave_credits',
          '',
          error3.message
        )
        throw new Error(error3.message)
      }
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
      // User is already approved in the DB at this point; only the email failed.
      return NextResponse.json({
        message: 'Successfully approved',
        emailError: error2
      })
    }

    return NextResponse.json({ message: 'Successfully approved' })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Approval failed' },
      { status: 500 }
    )
  }
}
