'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/utils/fetchApi'
import type { Employee } from '@/types'
import { format } from 'date-fns'

interface InsertArrayTypes {
  adjustment_date: string
  balance: number
  user_id: string
  particulars: string
  credits_earned: string
  type: string
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

  const getLatestDateLessThanOrEqualToday = (date1: string, date2: string, date3: string) => {
    const today = new Date()

    // Convert input dates to Date objects
    const dates = []
    if (date1) dates.push(new Date(date1))
    if (date2) dates.push(new Date(date2))
    if (date3) dates.push(new Date(date3))

    // Filter dates that are less than or equal to today
    const validDates = dates.filter(date => date <= today)

    // Find the latest date from the valid dates using reduce
    if (validDates.length > 0) {
      const latestDate = validDates.reduce((maxDate, currentDate) =>
        currentDate > maxDate ? currentDate : maxDate, validDates[0])

      return format(latestDate, 'yyyy-MM-dd')
    } else {
      return false
    }
  }

  const handleIncrements = (employees: Employee[], type: string, transactionType: string) => {
    // Filter only those position type equal to Non-teaching and has joining date or date_of_last_promotion or date_of_last_designation
    const filteredEmployees = employees.filter((employee: Employee) => {
      if (employee.position_type !== 'Non-teaching') return false
      if (!employee.joining_date && !employee.date_of_last_promotion && !employee.date_of_last_designation) return false
      return true
    })

    // Insert array variable
    const insertArray: InsertArrayTypes[] = []

    // Loop the filtered employees
    filteredEmployees.length > 0 && filteredEmployees.forEach((employee: Employee) => {
      // Get the latest record from leave card table to get the latest VL/SL balance, Sort first by ID in descending order
      const credits = employee.hrm_leave_cards.filter(card => card.type === type)
      if (credits.length > 0) {
        const compareFunction = (a: { id: string }, b: { id: string }) => Number(b.id) - Number(a.id)
        const sortedCredits = credits.sort(compareFunction)

        const balance = sortedCredits[0].balance

        console.log('balance', balance)

        // Get the last date of auto increment and add 1 month and add to insert array
        const increments = credits.filter(item => item.transaction_type === transactionType)
        if (increments.length > 0) {
          const sorteIncrements = increments.sort(compareFunction)
          const adjustmentDate = sorteIncrements[0].adjustment_date

          // Add 1 month
          const newAdjustmentDate = new Date(adjustmentDate)
          newAdjustmentDate.setMonth(newAdjustmentDate.getMonth() + 1)

          const today = new Date()
          if (newAdjustmentDate <= today) {
            // Add to insert array
            insertArray.push({
              adjustment_date: format(newAdjustmentDate, 'yyyy-MM-dd'),
              balance: Number(balance) + 1.250,
              user_id: employee.id,
              particulars: type,
              credits_earned: '1.250',
              type,
              remarks: 'System Automation'
            })
          }
        } else {
          // else if not present, add to insert array if (latest joining_date or date_of_last_promotion or date_of_last_designation) less than or equal to today's date)
          const latestDate = getLatestDateLessThanOrEqualToday(employee.joining_date, employee.date_of_last_promotion, employee.date_of_last_designation)

          if (latestDate) {
            // Add 1 month
            const newAdjustmentDate = new Date(latestDate)
            newAdjustmentDate.setMonth(newAdjustmentDate.getMonth() + 1)

            const today = new Date()
            if (newAdjustmentDate <= today) {
              // Add to insert array
              insertArray.push({
                adjustment_date: format(newAdjustmentDate, 'yyyy-MM-dd'),
                balance: Number(balance) + 1.250,
                user_id: employee.id,
                particulars: type,
                credits_earned: '1.250',
                type,
                remarks: 'System Automation'
              })
            }
          }
        }

        // Insert array = [{ user_id, particulars, type, credits earned, balance }, ...]
      }
    })

    console.log('insertArray', insertArray)
    // Insert the insert array to leave card table in the database
  }

  useEffect(() => {
    void (async () => {
      console.log('Initializing')

      // Get all employees from database and join the related leave card table
      const { data: employees, error: errors2 } = await supabase
        .from('hrm_users')
        .select('*, hrm_leave_cards(*)', { count: 'exact' })
        .eq('status', 'Active')

      if (errors2) {
        void logError('Cron Job', 'hrm_ctos', '', errors2.message)
        throw new Error(errors2.message)
      }

      void handleIncrements(employees, 'Sick Leave', 'Earned Sick Leave')
    })()
  }, [])
}

export default Page
