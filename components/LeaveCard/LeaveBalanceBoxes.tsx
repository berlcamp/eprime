'use client'

import { leaveCreditTypes } from '@/constants'
import type { Employee } from '@/types'
import { fetchLeaveCards } from '@/utils/fetchApi'
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

  const getBalance = (data: any, type: string) => {
    const find = data.find((item: any) => item.type === type)
    if (find) {
      return find.balance
    } else {
      return null
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const result = await fetchLeaveCards(user.id, '', 300, 0)

        const balances: Array<{ type: string; balance: string }> = []

        if (result.data) {
          leaveCreditTypes.forEach((leave) => {
            if (
              leave.gender.toLowerCase() === user.gender.toLowerCase() ||
              leave.gender.toLowerCase() === 'all'
            ) {
              const bal = getBalance(result.data, leave.type)
              if (bal) {
                balances.push({
                  type: leave.type,
                  balance: bal
                })
              }
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
