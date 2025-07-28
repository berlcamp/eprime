import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Monthly VL/SL increments
    console.log('Calling increment_monthly_leave_credits...')
    const { error } = await supabase.rpc('increment_monthly_leave_credits')
    if (error) throw new Error(error.message)

    console.log('increment_monthly_leave_credits succeeded')
    // CTO expiration cron
    const { error: ctoError } = await supabase.rpc('automate_cto_expiration')
    if (ctoError) {
      throw new Error(`automate_cto_expiration cron: ${ctoError.message}`)
    }

    // Reset annual leave credits
    const { error: resetYearlyCreditsError } = await supabase.rpc(
      'reset_annual_leave_credits'
    )
    if (resetYearlyCreditsError) {
      throw new Error(
        `reset_annual_leave_credits cron: ${resetYearlyCreditsError.message}`
      )
    }

    // NOSI cron
    const { error: nosiCronError } = await supabase.rpc('process_nosi')
    if (nosiCronError) {
      throw new Error(`process_nosi cron: ${nosiCronError.message}`)
    }

    return NextResponse.json('Cron completed', { status: 200 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    } else {
      return NextResponse.json(
        { message: 'An unknown error occurred' },
        { status: 500 }
      )
    }
  }
}
