import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { message: 'Server configuration incomplete' },
      { status: 503 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: schoolYears, error } = await supabase
      .from('hrm_school_years')
      .select()

    if (error) throw new Error(error.message)

    if (!schoolYears || schoolYears.length === 0) {
      return NextResponse.json('No school years configured', { status: 200 })
    }

    const shouldBeActive = schoolYears.find(
      (sy) => sy.start_date <= today && sy.end_date >= today
    )

    if (!shouldBeActive) {
      return NextResponse.json('No school year matches today — no changes made', { status: 200 })
    }

    const alreadyActive = schoolYears.find((sy) => sy.is_active)
    if (alreadyActive?.id === shouldBeActive.id) {
      return NextResponse.json(`School year "${shouldBeActive.title}" already active`, { status: 200 })
    }

    // Deactivate all, then activate the correct one
    const { error: deactivateError } = await supabase
      .from('hrm_school_years')
      .update({ is_active: false })
      .eq('is_active', true)

    if (deactivateError) throw new Error(deactivateError.message)

    const { error: activateError } = await supabase
      .from('hrm_school_years')
      .update({ is_active: true })
      .eq('id', shouldBeActive.id)

    if (activateError) throw new Error(activateError.message)

    return NextResponse.json(
      `School year advanced to "${shouldBeActive.title}"`,
      { status: 200 }
    )
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 })
  }
}
