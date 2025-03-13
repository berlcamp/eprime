'use client'

import {
  CustomButton,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar
} from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { ApplicantTypes, RankingTypes } from '@/types'

// Redux imports
import RspSidebar from '@/components/Sidebars/RspSidebar'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'

interface ListTypes {
  applicant: ApplicantTypes
  accumulated_points: Record<string, number> | null
  overall_score: string
  ranking: RankingTypes
}

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<ListTypes[] | []>([])
  const [filterRanking, setFilterRanking] = useState<string>('')
  const [downloading, setDownloading] = useState(false)
  const { supabase } = useSupabase()

  const handleDownloadExcel = async () => {
    setDownloading(true)

    // Create a new workbook and add a worksheet
    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Sheet 1')

    // Extract unique keys from accumulated_points dynamically
    const allKeys = Array.from(
      new Set(
        list.flatMap((item) => Object.keys(item.accumulated_points ?? {}))
      )
    )

    // Define worksheet columns dynamically
    worksheet.columns = [
      { header: 'No.', key: 'no', width: 10 },
      { header: 'Names of Applicant', key: 'name', width: 25 },
      ...allKeys.map((key) => ({ header: key, key, width: 15 })), // Dynamic columns
      { header: 'Overall Score', key: 'overall_score', width: 15 },
      { header: 'Ranking', key: 'ranking', width: 15 }
    ]

    // Data for the Excel file
    const data: any[] = list.map((item, index) => ({
      no: index + 1,
      name: `${item.applicant.lastname}, ${item.applicant.firstname} ${item.applicant.middlename}`,
      ...allKeys.reduce<Record<string, any>>((acc, key) => {
        acc[key] = item.accumulated_points?.[key] ?? '-' // Use "-" if value is missing
        return acc
      }, {}),
      overall_score: item.overall_score,
      ranking: item.ranking?.position?.name
    }))

    // Add data to the worksheet
    data.forEach((item) => worksheet.addRow(item))

    // Generate the Excel file
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      saveAs(blob, 'Open Ranking.xlsx')
    })
    setDownloading(false)
  }

  const fetchApplicantsData = async () => {
    if (filterRanking === '') return

    setLoading(true)

    const { data } = await supabase
      .from('hrm_ranking_applicants')
      .select(
        '*,applicant_documents:hrm_ranking_applicant_documents(qualification_id,status),ranking:ranking_id(type,year,status,position:position_id(name),chairman_id,committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
        {
          count: 'exact'
        }
      )
      .eq('evaluation_status', 'Qualified')
      .eq('ranking_id', filterRanking)
      .order('lastname', { assending: true })

    if (data.length > 0) {
      const structguredData: ListTypes[] = []
      data.forEach((d: ApplicantTypes) => {
        const accumulatedPoints: Record<string, number> | null =
          CommitteeAccumulatedPoints(d.id, d.ranking.committees)

        structguredData.push({
          applicant: d,
          ranking: d.ranking,
          accumulated_points: accumulatedPoints,
          overall_score: accumulatedPoints
            ? Object.values(accumulatedPoints)
                .reduce((sum: number, points) => sum + points, 0)
                .toFixed(3)
            : ''
        })
      })

      // Sort structguredData by overall_score in descending order
      structguredData.sort((a, b) => {
        const scoreA = parseFloat(a.overall_score || '0')
        const scoreB = parseFloat(b.overall_score || '0')
        return scoreB - scoreA // Sort in descending order
      })

      setList(structguredData)
    }

    setLoading(false)
  }

  // Featch data
  useEffect(() => {
    void fetchApplicantsData()
  }, [filterRanking])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Get all possible accumulated_points keys across data
  const allKeys = Array.from(
    new Set(list.flatMap((item) => Object.keys(item.accumulated_points ?? {})))
  )

  return (
    <>
      <Sidebar>
        <RspSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Open Ranking" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterRanking={setFilterRanking} />
          </div>

          {/* Export Button */}
          <div className="mx-4 mb-4 flex justify-end items-end space-x-2">
            <CustomButton
              containerStyles="app__btn_blue"
              isDisabled={downloading}
              title={downloading ? 'Downloading...' : 'Export Data To Excel'}
              btnType="button"
              handleClick={handleDownloadExcel}
            />
          </div>

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th pl-4">No.</th>
                  <th className="app__th">Fullname</th>
                  {allKeys.map((key) => (
                    <th className="app__th" key={key}>
                      {key}
                    </th>
                  ))}
                  <th className="app__th">Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item, index) => (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td">{index + 1}.</td>
                      <th className="app__th_firstcol">
                        <div>
                          {item.applicant.lastname}, {item.applicant.firstname}{' '}
                          {item.applicant.middlename}
                        </div>
                      </th>
                      {allKeys.map((key) => (
                        <td key={key} className="app__td">
                          {Number(item.accumulated_points?.[key]).toFixed(3) ??
                            '-'}
                        </td>
                      ))}
                      <td className="app__td">{item.overall_score}</td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={3} rows={2} />}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
