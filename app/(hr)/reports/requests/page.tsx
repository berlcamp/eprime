/* eslint-disable @typescript-eslint/no-non-null-assertion */
'use client'

import { useEffect, useState } from 'react'

import { Sidebar, Title, TopBar } from '@/components/index'
import ReportsSidebar from '@/components/Sidebars/ReportsSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabase } from '@/context/SupabaseProvider'
import { DateRangePicker } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

const requestTypes = [
  'Leave',
  'Locator Slip',
  'Pass Slip',
  'Service Record Print Request',
  'Travel Authority',
  'Undertime Permit'
]

const leaveTypes = [
  'Vacation Leave',
  'Sick Leave',
  'Compensatory Time Off',
  'Mandatory/Forced Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Special Privilege Leave',
  'Solo Parent Leave',
  'Study Leave',
  '10-Day VAWC Leave',
  'Rehabilitation Privilege',
  'Special Leave Benefits for Women',
  'Special Emergency (Calamity) Leave',
  'Adoption Leave',
  'Terminal/Monetization Leave',
  '30 days Maternity Leave Extension (without pay)',
  '15 days Maternity Leave Extension for Solo Parent (with pay)',
  '7 days Additional Paternity Leave (from wife-maternity leave)',
  'Others'
]

export default function ReportRequestsPage() {
  const [mode, setMode] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>(
    'daily'
  )
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ])
  const [requestCounts, setRequestCounts] = useState<any>({})
  const [leaveCounts, setLeaveCounts] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const { supabase } = useSupabase()

  const getDateFilter = () => {
    const today = new Date()
    let start, end

    switch (mode) {
      case 'daily':
        start = new Date(today.setHours(0, 0, 0, 0))
        end = new Date()
        break

      case 'weekly': {
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday
        start = new Date(today.setDate(diff))
        start.setHours(0, 0, 0, 0)
        end = new Date()
        break
      }

      case 'monthly':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date()
        break

      case 'custom':
        start = range[0].startDate
        end = range[0].endDate
        break

      default:
        start = end = new Date()
    }

    return { start, end }
  }

  const loadData = async () => {
    setLoading(true)

    const { start, end } = getDateFilter()

    // 1️⃣ Fetch all approved requests in range
    const { data, error } = await supabase
      .from('hrm_request_trackers')
      .select('type, leave_type, date_approved')
      .gte('date_approved', start.toISOString().split('T')[0])
      .lte('date_approved', end.toISOString().split('T')[0])

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    // 2️⃣ Count request types
    const reqCount: any = {}
    requestTypes.forEach((r) => (reqCount[r] = 0))
    data.forEach((row) => {
      if (reqCount[row.type] !== undefined) reqCount[row.type]++
    })

    // 3️⃣ Count leave types
    const lCount: any = {}
    leaveTypes.forEach((l) => (lCount[l] = 0))

    data
      .filter((x) => x.type === 'Leave')
      .forEach((x) => {
        if (lCount[x.leave_type] !== undefined) lCount[x.leave_type]++
        else lCount.Others++
      })

    setRequestCounts(reqCount)
    setLeaveCounts(lCount)
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [mode, range])

  return (
    <>
      <Sidebar>
        <ReportsSidebar />
      </Sidebar>
      <TopBar />

      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="HR Requests Reports" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <div className="flex items-center gap-4">
              <select
                className="border px-2 py-1 rounded text-xs"
                value={mode}
                onChange={(e) =>
                  setMode(
                    e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom'
                  )
                }
              >
                <option value="daily">Today</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {mode === 'custom' && (
                <DateRangePicker
                  onChange={(item) =>
                    setRange([
                      {
                        startDate: item.selection.startDate!,
                        endDate: item.selection.endDate!,
                        key: 'selection'
                      }
                    ])
                  }
                  moveRangeOnFirstSelection={false}
                  ranges={range}
                />
              )}
            </div>
          </div>
          <div className="w-full px-4 pt-4 bg-gray-100">
            {/* Request Type Cards */}
            <h2 className="font-semibold text-lg">Request Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {requestTypes.map((t) => (
                <Card key={t} className="rounded-xl shadow">
                  <CardHeader>
                    <CardTitle className="text-sm">{t}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center">
                      {loading ? '...' : requestCounts[t] ?? 0}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Leave Type Cards */}
            <h2 className="font-semibold text-lg mt-6">Leave Types</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {leaveTypes.map((l) => (
                <Card key={l} className="rounded-xl shadow">
                  <CardHeader>
                    <CardTitle className="text-sm">{l}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center">
                      {loading ? '...' : leaveCounts[l] ?? 0}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
