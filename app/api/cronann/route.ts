import { leaveCreditTypes } from '@/constants'
import { Employee } from '@/types'
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
    /*
     * Automated CTO Expiration
     */
    const { data, error } = await supabase
      .from('hrm_users')
      .select()
      .eq('status', 'Active')

    if (error) {
      throw new Error(error.message)
    }

    const currentYear = new Date().getFullYear() // Get the current year
    const nextYear = currentYear + 1 // Add 1 to the current year
    const resetDate = `${nextYear}/01/02`

    const insertData: any = []
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    data.forEach(async (emp: Employee) => {
      const leaveCardData = leaveCreditTypes.map((l) => {
        return {
          type: l.type,
          gender: l.gender,
          position_type: l.position_type,
          date_of_next_reset:
            l.type !== 'Vacation Leave' && l.type !== 'Sick Leave'
              ? resetDate
              : null,
          credits: l.credits,
          user_id: emp.id
        }
      })

      insertData.push(...leaveCardData)
    })

    console.log('len: ', insertData.length)
    // const { error: error3 } = await supabase
    //   .from('hrm_leave_credits')
    //   .insert(insertData)

    // if (error3) {
    //   throw new Error(error3.message)
    // }

    return NextResponse.json('Cron completed')
  } catch (error) {
    console.log('Error: ', error)
    return NextResponse.json(error)
  }
}
