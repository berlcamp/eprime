import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import { logError } from '@/utils/fetchApi'

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

    /*
     * Auto update employee's date_of_last_designation and position_type based from effectivity date of designation
    */

    /*
     * Automated Leave Card Adjustments System
    */

    // Get all employees from database and join the related leave card table

    // Filter only those who has position type and joining date

    // Loop the filtered employees

    //  // Get the latest record from leave card table to get the latest VL/SL balance

    //  // Get the last date of auto increment and add 1 month and add to insert array

    //  // if not present, add to insert array if (latest joining_date or date_of_last_promotion or date_of_last_designation) less than or equal to today's date)

    //  // Insert array = [{ user_id, particulars, type, credits earned, balance }, ...]

    // Insert the insert array to leave card table in the database

    return NextResponse.json('Cron completed')
  } catch (error) {
    console.log('Error: ', error)
    return NextResponse.json(error)
  }
}
