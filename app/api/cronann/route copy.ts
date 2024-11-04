import { logError } from '@/utils/fetchApi'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
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

  const today = format(new Date(), 'yyyy-MM-dd')

  try {
    /*
     * Automated CTO Expiration
     */
    const { error } = await supabase
      .from('hrm_ctos')
      .update({ status: 'Expired' })
      .is('status', null)
      .lte('expiration', today)

    if (error) {
      void logError('Cron Job', 'hrm_ctos', '', error.message)
      throw new Error(error.message)
    }

    const { error: error2 } = await supabase
      .from('hrm_cto_users')
      .update({ status: 'Expired' })
      .is('status', null)
      .lte('expiration', today)

    if (error2) {
      void logError('Cron Job', 'hrm_cto_users', '', error2.message)
      throw new Error(error2.message)
    }

    /*
     * Auto update employee's date_of_last_designation and position_type based from effectivity date of designation
     */

    /*
     * Automated NOSI Generation
     */
    await generateNosi(supabase)

    return NextResponse.json('Cron completed')
  } catch (error) {
    console.log('Error: ', error)
    return NextResponse.json(error)
  }
}

// NOSI generation logic
async function generateNosi(supabase: any) {
  try {
    // Fetch all active employees
    const { data: employees, error } = await supabase
      .from('hrm_users')
      .select(
        'id, date_of_last_promotion, status, joining_date, absent_days_without_pay, item_id'
      )
      .not('item_id', 'is', null)
      .eq('status', 'active')

    if (error) throw new Error(`Error fetching employees: ${error.message}`)

    const today = new Date()

    // Loop through each employee to check if NOSI should be generated
    for (const employee of employees) {
      const {
        id,
        date_of_last_promotion,
        joining_date,
        absent_days_without_pay
      } = employee

      // Calculate the latest relevant date (promotion or joining)
      let referenceDate = new Date(joining_date)
      if (
        date_of_last_promotion &&
        new Date(date_of_last_promotion) > new Date(joining_date)
      ) {
        referenceDate = new Date(date_of_last_promotion)
      }

      // Add 3 years to the reference date
      const nosiDate = new Date(referenceDate)
      nosiDate.setFullYear(nosiDate.getFullYear() + 3)

      // Ensure absent_days_without_pay is a number
      const absentDaysWithoutPay = Number(absent_days_without_pay)

      // Add extra days if absent_days_without_pay > 90
      if (absentDaysWithoutPay > 90) {
        nosiDate.setDate(nosiDate.getDate() + absentDaysWithoutPay)
      }

      // Check if the current date has reached or passed the calculated NOSI date
      if (today >= nosiDate) {
        // Generate the NOSI record
        const { error: nosiError } = await supabase.from('hrm_nosi').insert({
          user_id: id
        })

        if (nosiError) {
          void logError('Cron Job', 'hrm_nosi', id, nosiError.message)
          continue // Move to next employee if error
        }

        console.log(`NOSI generated for user ${id}`)

        // Reset absent_days_without_pay to 0
        await supabase
          .from('hrm_users')
          .update({ absent_days_without_pay: 0 })
          .eq('id', id)
      }
    }
  } catch (error) {
    console.error('Error generating NOSI: ', error)
  }
}
