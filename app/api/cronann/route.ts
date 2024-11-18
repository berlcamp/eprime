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

  // Trigger stored procedures
  const { data, error: incrementError } = await supabase.rpc(
    'increment_monthly_leave_credits'
  )

  if (incrementError) {
    return NextResponse.json(incrementError)
  } else {
    return NextResponse.json('Cron completed', data)
  }
}
