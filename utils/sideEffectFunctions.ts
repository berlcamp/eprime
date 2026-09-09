'use server'

import { NosiTypes } from '@/types'
import { createServerClient } from '@/utils/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { add, format, isEqual, parseISO } from 'date-fns'
import { formatToPesos } from './text-helper'

/**
 * NOSI side effects run under the service role: they write another employee's
 * salary step, service record and plantilla row, which the acting user's own
 * RLS grant does not cover.
 *
 * This module used to build that service-role client at import time from
 * `NEXT_PUBLIC_SERVICE_ROLE_KEY`. Its only caller is `app/(hr)/nosi/AddEditModal`,
 * which sits under a `'use client'` page — so the key was inlined into the
 * browser bundle and anyone who loaded the site could read it and bypass RLS
 * on every table in the project.
 *
 * It is now a Server Action. The key never leaves the server, and because a
 * Server Action is a publicly reachable endpoint, `nosiSideEffects`
 * authenticates its caller before it does anything.
 */

// Built per call, not at module scope: this file must not hold a privileged
// client that an accidental client import could reach.
function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. NOSI side effects cannot run.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Records a failed transaction in `error_logs`.
 *
 * `utils/error-log.ts` cannot be used here: it builds a browser Supabase
 * client at module scope, which has no meaning on the server. Same table,
 * same shape, written with the client we already hold.
 */
async function logServerError(
  supabase: ReturnType<typeof serviceRoleClient>,
  transaction: string,
  table: string,
  data: string,
  error: string
) {
  try {
    await supabase.from('error_logs').insert({
      system: 'hrm',
      transaction,
      table,
      data,
      error
    })
  } catch (e) {
    console.error(
      `[error-log] could not write to error_logs (${
        e instanceof Error ? e.message : String(e)
      }). Original error follows:`,
      { transaction, table, data, error }
    )
  }
}

export async function nosiSideEffects(nosi: NosiTypes) {
  // A Server Action is reachable by anyone who can POST to the app, so the
  // caller is verified here rather than relied upon from the UI. getUser()
  // revalidates the session against the auth server; getSession() would only
  // decode the cookie.
  const auth = await createServerClient()
  const {
    data: { user },
    error: authError
  } = await auth.auth.getUser()

  if (authError || !user) {
    return { status: 'error', error: new Error('Not authenticated.') }
  }

  const supabase = serviceRoleClient()

  const effectivityDate = format(new Date(nosi.effective_date), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')
  const userId = nosi.user_id

  if (isEqual(parseISO(today), parseISO(effectivityDate))) {
    try {
      // Update user account salary step
      const { error } = await supabase
        .from('hrm_users')
        .update({
          salary_step: nosi.new_step
        })
        .eq('id', userId)

      if (error) {
        void logServerError(
          supabase,
          'Update account details',
          'hrm_users',
          JSON.stringify({
            salary_step: nosi.new_step
          }),
          error.message
        )

        throw new Error(error.message)
      }

      // insert to notifications
      await supabase.from('hrm_notifications').insert({
        message: `Your Salary Step is hereby adjusted effective ${format(
          new Date(nosi.effective_date),
          'MMMM dd, yyyy'
        )}`,
        url: `/profile/${userId}?page=nosi`,
        type: 'nosi',
        user_id: userId,
        nosi_id: nosi.id,
        reference_table: 'hrm_nosi'
      })

      // Add to service record
      const newData = {
        user_id: userId,
        nosi_id: nosi.id,
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
        from: today,
        to: today,
        salary: formatToPesos(Number(nosi.new_amount)),
        remarks: 'Step Increment'
      }
      const { error: error2 } = await supabase
        .from('hrm_service_records')
        .insert(newData)
        .select()

      if (error2) {
        void logServerError(
          supabase,
          'Add NOSI to service record',
          'hrm_service_records',
          JSON.stringify(newData),
          error2.message
        )
        throw new Error(error2.message)
      }

      // Update plantilla if theres any connected.
      // Read with the client we already hold rather than fetchApi's
      // browser client, which cannot run on the server.
      const { data: SalaryGradesresult } = await supabase
        .from('hrm_salaries')
        .select('*')
        .eq('is_active', 'yes')
        .order('id', { ascending: false })
        .limit(999)

      if (SalaryGradesresult && SalaryGradesresult.length > 0) {
        // Find the matching salary for the employee's grade and step
        const matchingSalary = SalaryGradesresult.find(
          (sg) =>
            sg.grade.toString() === nosi.hrm_user?.salary_grade &&
            sg.step.toString() === nosi.new_step
        )

        if (matchingSalary) {
          const actualAnnual = matchingSalary.salary * 12
          const { error: error3 } = await supabase
            .from('hrm_items')
            .update({
              actual_annual_salary: actualAnnual
            })
            .eq('user_id', nosi.user_id)

          if (error3) {
            void logServerError(
              supabase,
              'Update Plantilla from nosi',
              'hrm_items',
              JSON.stringify({
                actual_annual_salary: actualAnnual
              }),
              error3.message
            )
            throw new Error(error3.message)
          }
        }
      }

      // Reset step_increment_leave_days && date_of_next_step_increment
      const today2 = new Date()
      const threeYearsFromToday = add(today2, { years: 3 })

      const { error: error4 } = await supabase
        .from('hrm_users')
        .update({
          step_increment_leave_days: 0,
          date_of_next_step_increment:
            nosi.new_step.toString() !== '8'
              ? format(threeYearsFromToday, 'yyyy-MM-dd')
              : null // no more next increment if step = 8
        })
        .eq('id', nosi.user_id)

      if (error4) {
        void logServerError(
          supabase,
          'Update Reset step_increment_leave_days && date_of_next_step_increment',
          'hrm_users',
          '',
          error4.message
        )
        throw new Error(error4.message)
      }

      return { status: 'success', error: null }
    } catch (error) {
      return { status: 'error', error }
    }
  } else {
    // insert to notifications
    await supabase.from('hrm_notifications').insert({
      message: 'You are entitled to a Salary Step Increment.',
      url: `/profile/${userId}?page=nosi`,
      type: 'nosi',
      user_id: userId,
      nosi_id: nosi.id,
      reference_table: 'hrm_nosi'
    })
    return { status: 'success', error: null }
  }
}
