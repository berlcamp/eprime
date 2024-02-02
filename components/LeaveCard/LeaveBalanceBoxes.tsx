'use client'

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

export default function LeaveBalanceBoxes ({ user }: ModalProps) {
  const [balanceBoxes, setBalanceBoxes] = useState<boxes[] | []>([])
  useEffect(() => {
    void (async () => {
      try {
        const result = await fetchLeaveCards(user.id, '', 300, 0)

        const balances = []

        if (result.data) {
          if (user.position_type === 'Non-teaching') {
            const slList = result.data.filter(item => item.type === 'Sick Leave')
            const vlList = result.data.filter(item => item.type === 'Vacation Leave')
            const cocList = result.data.filter(item => item.type === 'Compensatory Overtime Credit')

            // first index of array should be the latest and updated balance
            if (slList.length > 0) {
              balances.push({ type: 'SL', balance: slList[0].balance })
            }
            if (vlList.length > 0) {
              balances.push({ type: 'VL', balance: vlList[0].balance })
            }
            if (cocList.length > 0) {
              balances.push({ type: 'COC', balance: cocList[0].balance })
            }
          } else {
            const scList = result.data.filter(item => item.type === 'Service Credit')

            // first index of array should be the latest and updated balance
            if (scList.length > 0) {
              balances.push({ type: 'Service Credits', balance: scList[0].balance })
            }
          }
        }

        setBalanceBoxes(balances)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  return (
    <>
      {
        balanceBoxes.map((balance, index) => (
          <span key={index} className='border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 mr-2'>{balance.type}: {balance.balance}</span>
        ))
      }
    </>
  )
}
