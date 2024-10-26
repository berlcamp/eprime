import { NosiTypes } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { add, format, isEqual, parseISO } from 'date-fns'
import { fetchSalaryGrades, logError } from './fetchApi'
import { formatToPesos } from './text-helper'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function nosiSideEffects(nosi: NosiTypes) {
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
        void logError(
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
        void logError(
          'Add NOSI to service record',
          'hrm_service_records',
          JSON.stringify(newData),
          error2.message
        )
        throw new Error(error2.message)
      }

      // Update plantilla if theres any connected
      const { data: SalaryGradesresult } = await fetchSalaryGrades(999, 0)
      if (SalaryGradesresult.length > 0) {
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
            void logError(
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
        void logError(
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
