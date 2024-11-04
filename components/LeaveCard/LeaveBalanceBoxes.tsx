'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import type { Employee, LeaveCreditTypes } from '@/types'
import { useEffect, useState } from 'react'

interface ModalProps {
  user: Employee
}

interface boxes {
  type: string
  balance: string
}

export default function LeaveBalanceBoxes({ user }: ModalProps) {
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
        setBalanceBoxes(balances)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

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
