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
    const { data, error: incrementError } = await supabase.rpc(
      'increment_monthly_leave_credits'
    )

    if (incrementError) {
      throw new Error(incrementError.message)
    }

    if (data[0].status === 'Error') {
      throw new Error(`Increment failed: ${data[0].status}`)
    }

    // CTO expiration cron
    const { error: ctoError } = await supabase.rpc('automate_cto_expiration')
    if (ctoError) {
      throw new Error(ctoError.message)
    }

    // Reset annual leave credits
    const { error: resetYearlyCreditsError } = await supabase.rpc(
      'reset_annual_leave_credits'
    )
    if (resetYearlyCreditsError) {
      throw new Error(resetYearlyCreditsError.message)
    }

    // NOSI cron
    const { error: nosiCronError } = await supabase.rpc('process_nosi')
    if (nosiCronError) {
      throw new Error(nosiCronError.message)
    }

    return NextResponse.json('Cron completed', { status: 200 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred' },
        { status: 500 }
      )
    }
  }
}
