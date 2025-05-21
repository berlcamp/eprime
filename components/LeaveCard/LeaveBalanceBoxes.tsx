'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import type { CtoUserTypes, Employee, LeaveCreditTypes } from '@/types'
import { useEffect, useState } from 'react'

interface ModalProps {
  user: Employee
  refresh?: boolean
}

interface boxes {
  type: string
  balance: string
}

export default function LeaveBalanceBoxes({ user, refresh }: ModalProps) {
  const [balanceBoxes, setBalanceBoxes] = useState<boxes[] | []>([])
  const { supabase } = useSupabase()

  useEffect(() => {
    void (async () => {
      const exclude: string[] = []
      if (user.position_type === 'Teaching') {
        exclude.push(
          'Vacation Leave',
          'Sick Leave',
          'Compensatory Overtime Credit'
        )
      } else {
        exclude.push('Service Credit')
      }

      if (user.gender === 'Male') {
        exclude.push(
          'Maternity Leave',
          'Special Leave Benefits For Women',
          '10-Day VAWC Leave'
        )
      } else {
        exclude.push('Paternity Leave')
      }

      try {
        const { data } = await supabase
          .from('hrm_leave_credits')
          .select()
          .eq('user_id', user.id)

        const balances: boxes[] = []
        if (data && data.length > 0) {
          const credits: LeaveCreditTypes[] = data
          credits.forEach((credit) => {
            if (!exclude.includes(credit.type)) {
              balances.push({
                type: credit.type,
                balance: credit.credits.toString()
              })
            }
          })
        }

        // Get COC balance
        const { data: ctos } = await supabase
          .from('hrm_cto_users')
          .select()
          .eq('hrm_user_id', user.id)
          .eq('is_approved', true)
          .gte('expiration', new Date().toISOString())
          .gt('coc', 0)

        if (ctos) {
          ctos.forEach((cto: CtoUserTypes) => {
            if (cto.status !== 'Expired') {
              balances.push({
                type: `COC (Exp. ${cto.expiration})`,
                balance: cto.coc.toString()
              })
            }
          })
        }

        // Get force leave if month is december
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1 // Months are zero-based, so December is 11 + 1 = 12

        // Only perform the query if the current month is December
        if (currentMonth <= 3 && user.position_type !== 'Teaching') {
          // Fetch the data
          const { data: leaveRequests } = await supabase
            .from('hrm_request_trackers')
            .select('id')
            .eq('created_by', user.id)
            .eq('type', 'Leave')
            .in('leave_type', ['Mandatory/Forced Leave', 'Vacation Leave'])
            .eq('current_status', 'Approved')

          const reqIds: string[] = []

          if (leaveRequests && leaveRequests.length > 0) {
            leaveRequests.forEach((lr) => {
              reqIds.push(lr.id)
            })
          }

          // Get all dates form leave_dates
          const { data: leaveDates } = await supabase
            .from('hrm_leave_dates')
            .select()
            .in('tracker_id', reqIds)
            .eq('is_paid', true)
            .gte('date', `${currentYear}-01-01`) // Start of the year
            .lte('date', `${currentYear}-12-31`) // End of the year

          if (leaveDates) {
            if (leaveDates.length <= 5) {
              balances.push({
                type: 'Force Leave',
                balance: (5 - Number(leaveDates.length)).toString()
              })
            }
          } else {
            balances.push({
              type: 'Force Leave',
              balance: '5'
            })
          }
        }

        setBalanceBoxes(balances)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [refresh])

  return (
    <div className="space-y-2">
      {balanceBoxes.map((balance, index) => (
        <div
          key={index}
          className="inline-flex border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-xs mr-2"
        >
          {balance.type}: {balance.balance}
        </div>
      ))}
    </div>
  )
}
