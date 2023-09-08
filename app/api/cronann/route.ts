import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

export async function GET () {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const today = format(new Date(), 'yyyy-MM-dd')

  try {
    const { error } = await supabase
      .from('hrm_ctos')
      .update({ status: 'Expired' })
      .is('status', null)
      .lte('expiration', today)
    if (error) throw new Error('ctos error' + error.message)
    return NextResponse.json('ctos updated')
  } catch (error) {
    console.log(error)
  }
}
