/* eslint-disable @typescript-eslint/no-throw-literal */
'use client'

import {
  CustomButton,
  Sidebar,
  Title,
  TopBar,
  UserBlock
} from '@/components/index'
import RandRSidebar from '@/components/Sidebars/RandRSidebar'
import { useSupabase } from '@/context/SupabaseProvider'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import LoyaltyFilter from './LoyaltyFilter'

export default function Page() {
  const [filterYears, setFilterYears] = useState<number | null>(null)
  const [rawUsers, setRawUsers] = useState<any[]>([])
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { supabase } = useSupabase()

  async function fetchLoyaltyUsers() {
    const query = supabase
      .from('hrm_users')
      .select(
        `
      id,
      firstname,
      middlename,
      lastname,
      email,
      position_type,
      joining_date,
      office:office_id(name),
      district:district_id(name),
      school:school_id(name)
    `
      )
      .order('lastname', { ascending: true })

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // Fetch directly from DB
  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await fetchLoyaltyUsers()
      setRawUsers(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  // Compute length of service
  const calculateYears = (joiningDate: string | null) => {
    if (!joiningDate) return 0
    const start = new Date(joiningDate)
    const now = new Date()
    return now.getFullYear() - start.getFullYear()
  }

  // Apply loyalty range filtering
  useEffect(() => {
    if (!filterYears) {
      setList([])
      return
    }

    const minYears = filterYears
    const maxYears = filterYears + 5

    const results = rawUsers.filter((user) => {
      const years = calculateYears(user.joining_date)
      return years >= minYears && years < maxYears
    })

    setList(results)
  }, [filterYears, rawUsers])

  // Download Excel based on filtered list
  const handleDownloadExcel = () => {
    if (list.length === 0) {
      alert('No data to download.')
      return
    }

    const rows = list.map((item) => ({
      Employee: `${item.lastname}, ${item.firstname} ${item.middlename ?? ''}`,
      'Joining Date': item.joining_date ?? '',
      'Years of Service': calculateYears(item.joining_date),
      Email: item.email ?? '',
      Position: item.position_type ?? '',
      Office: item.office?.name ?? '',
      District: item.district?.name ?? '',
      School: item.school?.name ?? ''
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Loyalty Award')

    XLSX.writeFile(wb, `loyalty-award-${filterYears}yrs.xlsx`)
  }

  return (
    <>
      <Sidebar>
        <RandRSidebar />
      </Sidebar>
      <TopBar />

      <div className="app__main">
        <div className="app__title">
          <Title title="Loyalty Award" />
        </div>

        <div className="app__filters">
          <LoyaltyFilter setFilterYears={setFilterYears} />
        </div>
        {list.length > 0 && (
          <div className="flex px-4">
            <CustomButton
              title="Export to Excel"
              containerStyles="app__btn_blue mt-3 ml-auto"
              btnType="button"
              handleClick={handleDownloadExcel}
            />
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th">Employee</th>
                  <th className="app__th">Position</th>
                  <th className="app__th">Office</th>
                  <th className="app__th">School</th>
                  <th className="app__th">Years of Service</th>
                </tr>
              </thead>

              <tbody>
                {list.length === 0 ? (
                  <tr className="app__tr">
                    <td className="app__td" colSpan={5}>
                      No record found
                    </td>
                  </tr>
                ) : (
                  list.map((item, i) => (
                    <tr key={i} className="app__tr">
                      <td className="app__td">
                        <UserBlock user={item} />
                      </td>

                      <td className="app__td">{item.position_type || '—'}</td>

                      <td className="app__td">{item.office?.name || '—'}</td>

                      <td className="app__td">{item.school?.name || '—'}</td>

                      <td className="app__td">
                        {calculateYears(item.joining_date)} years
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
