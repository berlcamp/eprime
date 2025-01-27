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

  // Monthly VL/SL increments
  const { data, error: incrementError } = await supabase.rpc(
    'increment_monthly_leave_credits'
  )
  if (incrementError) {
    return NextResponse.json(incrementError)
  }

  // CTO expiration cron
  const { error: ctoError } = await supabase.rpc('automate_cto_expiration')
  if (ctoError) {
    return NextResponse.json(ctoError)
  }

  // Reset annualy credits
  const { error: resetYearlyCreditsError } = await supabase.rpc(
    'reset_annual_leave_credits'
  )
  if (resetYearlyCreditsError) {
    return NextResponse.json(resetYearlyCreditsError)
  }

  // NOSI
  const { error: nosiCronError } = await supabase.rpc('process_nosi')
  if (nosiCronError) {
    return NextResponse.json(nosiCronError)
  }

  return NextResponse.json('Cron completed', data)
}
