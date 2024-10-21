'use client'

import type { Employee } from '@/types'
import { logError } from '@/utils/fetchApi'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { useEffect } from 'react'

interface InsertArrayTypes {
  adjustment_date: string
  balance: number
  user_id: string
  particulars: string
  credits_earned: string
  type: string
  transaction_type: string
  remarks: string
}

const Page = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const getLatestDateLessThanOrEqualToday = (
    date1: string,
    date2: string,
    date3: string
  ) => {
    const today = new Date()

    // Convert input dates to Date objects
    const dates = []
    if (date1) dates.push(new Date(date1))
    if (date2) dates.push(new Date(date2))
    if (date3) dates.push(new Date(date3))

    // Filter dates that are less than or equal to today
    const validDates = dates.filter((date) => date <= today)

    // Find the latest date from the valid dates using reduce
    if (validDates.length > 0) {
      const latestDate = validDates.reduce(
        (maxDate, currentDate) =>
          currentDate > maxDate ? currentDate : maxDate,
        validDates[0]
      )

      return format(latestDate, 'yyyy-MM-dd')
    } else {
      return false
    }
  }

  const handleIncrements = async (employees: Employee[], type: string) => {
    if (!employees) return

    // Filter only those position type equal to Non-teaching and has joining date or date_of_last_promotion or date_of_last_designation
    const filteredEmployees = employees.filter((employee: Employee) => {
      if (employee.position_type !== 'Non-teaching') return false
      if (
        !employee.joining_date &&
        !employee.date_of_last_promotion &&
        !employee.date_of_last_designation
      )
        return false
      return true
    })

    // Insert array variable
    const insertArray: InsertArrayTypes[] = []

    // Loop the filtered employees
    filteredEmployees.length > 0 &&
      filteredEmployees.forEach((employee: Employee) => {
        // Get the latest record from leave card table to get the latest VL/SL balance, Sort first by ID in descending order
        const credits = employee.hrm_leave_cards.filter(
          (card) => card.type === type
        )
        if (credits.length > 0) {
          const compareFunction = (a: { id: string }, b: { id: string }) =>
            Number(b.id) - Number(a.id)
          const sortedCredits = credits.sort(compareFunction)

          const balance = sortedCredits[0].balance

          console.log('balance', balance)

          // Get the last date of auto increment and add 1 month and add to insert array
          const increments = credits.filter(
            (item) => item.transaction_type === `Earned ${type}`
          )
          if (increments.length > 0) {
            const sorteIncrements = increments.sort(compareFunction)
            const adjustmentDate = sorteIncrements[0].adjustment_date

            // Add 1 month
            const newAdjustmentDate = new Date(adjustmentDate)
            newAdjustmentDate.setMonth(newAdjustmentDate.getMonth() + 1)

            // If date is less than or equal to today, add to insert array
            const today = new Date()
            if (newAdjustmentDate <= today) {
              // Add to insert array
              insertArray.push({
                adjustment_date: format(newAdjustmentDate, 'yyyy-MM-dd'),
                balance: Number(balance) + 1.25,
                user_id: employee.id,
                particulars: type,
                transaction_type: `Earned ${type}`,
                credits_earned: '1.250',
                type,
                remarks: 'System Automation'
              })
            }
          } else {
            // else if not present, add to insert array if (latest joining_date or date_of_last_promotion or date_of_last_designation) less than or equal to today's date)
            const latestDate = getLatestDateLessThanOrEqualToday(
              employee.joining_date,
              employee.date_of_last_promotion,
              employee.date_of_last_designation
            )

            if (latestDate) {
              // Add 1 month until it reaches to the latest date prior todays date
              const today = new Date()
              const updatedDate = new Date(latestDate)

              // eslint-disable-next-line no-unmodified-loop-condition
              while (updatedDate < today) {
                updatedDate.setMonth(updatedDate.getMonth() + 1)
                console.log(updatedDate)
              }

              // if (newAdjustmentDate <= today) {
              //   // Add to insert array
              //   insertArray.push({
              //     adjustment_date: format(newAdjustmentDate, 'yyyy-MM-dd'),
              //     balance: Number(balance) + 1.250,
              //     user_id: employee.id,
              //     particulars: type,
              //     credits_earned: '1.250',
              //     transaction_type: transactionType,
              //     type,
              //     remarks: 'System Automation'
              //   })
              // }
            }
          }
        }
      })

    console.log('insertArray', insertArray)

    // Insert the insert array to leave card table in the database
    if (insertArray.length > 0) {
      try {
        const { error } = await supabase
          .from('hrm_leave_cardsxx')
          .insert(insertArray)

        if (error) {
          void logError(
            'Cron Job Insert Incremented Credits',
            'hrm_leave_cards',
            JSON.stringify(insertArray),
            error.message
          )
          throw new Error(error.message)
        }
      } catch (error) {
        console.log(error)
      }
    }
  }

  useEffect(() => {
    void (async () => {
      console.log('Initializing')

      // Get all employees from database and join the related leave card table
      const { data: employees, error } = await supabase
        .from('hrm_users')
        .select('*, hrm_leave_cards(*)')
        .eq('status', 'Active')

      if (error) {
        void logError('Cron Job get users', 'hrm_users', '', error.message)
      }

      console.log(employees)

      if (!employees) return

      void handleIncrements(employees, 'Sick Leave')

      /*
       * Automated NOSI Generation
       */
      await generateNosi(supabase)
    })()
  }, [])
}

// NOSI generation logic
async function generateNosi(supabase: any) {
  console.log('generating nosi...')
  try {
    // Fetch all active employees
    const { data: employees, error } = await supabase
      .from('hrm_users')
      .select(
        'id, date_of_last_promotion, status, joining_date, absent_days_without_pay, item_id'
      )
      .not('item_id', 'is', null)
      .eq('status', 'Active')

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

export default Page
