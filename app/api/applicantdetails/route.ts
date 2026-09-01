import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { logError } from '@/utils/fetchApi'

/**
 * The applicant self-service edit, used by /applicantstatus.
 *
 * `hrm_ranking_applicants` only grants the anon role `select` and `insert`, so
 * the browser cannot update the row itself. Doing it here with the service role
 * also keeps the applicant from touching the fields the committee owns
 * (evaluation_status, code, ranking_id, points, ...): only the columns listed in
 * EDITABLE_FIELDS are ever written, and only for the row whose code was sent.
 */
const EDITABLE_FIELDS = [
  'lastname',
  'firstname',
  'middlename',
  'email',
  'address',
  'age',
  'sex',
  'civil_status',
  'religion',
  'disability',
  'ethnicity',
  'ethnicity_detail',
  'latin_honor',
  'special_program_beneficiary',
  'special_skills',
  'solo_parent',
  'solo_parent_detail',
  'contact_number',
  'specific_major'
] as const

/** Same rule the status page uses to gate uploads: today or later is still open. */
const isWithinComplianceDate = (dateString: string | null) => {
  if (!dateString) return false

  const deadline = new Date(dateString)
  if (isNaN(deadline.getTime())) return false

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

  return startOfDay(deadline) >= startOfDay(new Date())
}

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
    const { code, details } = (await req.json()) as {
      code?: string
      details?: Record<string, unknown>
    }

    if (!code || !details) {
      return NextResponse.json(
        { error: 'Application code is required.' },
        { status: 400 }
      )
    }

    const { data: applicant, error: lookupError } = await supabase
      .from('hrm_ranking_applicants')
      .select('id, ranking_id, ranking:ranking_id(status,days_to_comply)')
      .eq('code', code)
      .maybeSingle()

    if (lookupError) {
      void logError(
        'Lookup applicant for self-service edit',
        'hrm_ranking_applicants',
        code,
        lookupError.message
      )
      throw new Error(lookupError.message)
    }

    if (!applicant) {
      return NextResponse.json(
        { error: 'No matching application for this code.' },
        { status: 404 }
      )
    }

    const ranking = applicant.ranking as unknown as {
      status: string
      days_to_comply: string | null
    } | null

    if (ranking?.status !== 'Open') {
      return NextResponse.json(
        { error: 'This ranking is already closed. Details can no longer be edited.' },
        { status: 409 }
      )
    }

    if (!isWithinComplianceDate(ranking.days_to_comply)) {
      return NextResponse.json(
        { error: 'The compliance due date has passed. Details can no longer be edited.' },
        { status: 409 }
      )
    }

    // Only the whitelisted columns, and only the ones actually sent.
    const updates: Record<string, unknown> = {}
    EDITABLE_FIELDS.forEach((field) => {
      if (field in details) {
        updates[field] = details[field]
      }
    })

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }

    // The apply form treats email as unique per ranking; keep that true on edit.
    if (typeof updates.email === 'string') {
      const { data: duplicate, error: duplicateError } = await supabase
        .from('hrm_ranking_applicants')
        .select('id')
        .eq('ranking_id', applicant.ranking_id)
        .eq('email', updates.email)
        .neq('id', applicant.id)
        .maybeSingle()

      if (duplicateError) {
        void logError(
          'Check duplicate email on applicant self-service edit',
          'hrm_ranking_applicants',
          JSON.stringify({ code, email: updates.email }),
          duplicateError.message
        )
        throw new Error(duplicateError.message)
      }

      if (duplicate) {
        return NextResponse.json(
          { error: 'This email already applied for this Ranking.' },
          { status: 409 }
        )
      }
    }

    const { error: updateError } = await supabase
      .from('hrm_ranking_applicants')
      .update(updates)
      .eq('id', applicant.id)

    if (updateError) {
      void logError(
        'Applicant self-service edit',
        'hrm_ranking_applicants',
        JSON.stringify({ code, updates }),
        updateError.message
      )
      throw new Error(updateError.message)
    }

    return NextResponse.json({ message: 'Details updated' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not save your details. Please try again.'
      },
      { status: 500 }
    )
  }
}
