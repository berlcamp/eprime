'use client'

import {
  CustomButton,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { ApplicantTypes } from '@/types'

// Redux imports
import RspSidebar from '@/components/Sidebars/RspSidebar'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<ApplicantTypes[]>([])
  const [filterRanking, setFilterRanking] = useState<string>('')
  const [downloading, setDownloading] = useState(false)

  const { session, supabase } = useSupabase()
  const { hasAccess } = useFilter()

  const fetchData = async () => {
    if (filterRanking === '') return

    setLoading(true)

    try {
      const { data } = await supabase
        .from('hrm_ranking_applicants')
        .select(
          '*,ier:hrm_ranking_applicant_ier(*),ranking:ranking_id(code_prefix)',
          {
            count: 'exact'
          }
        )
        .eq('ranking_id', filterRanking)
        .order('lastname', { assending: true })
      console.log(data)
      setList(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)

    // Create a new workbook and add a worksheet
    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Sheet 1')

    // Add data to the worksheet
    worksheet.columns = [
      { header: 'No.', key: 'no', width: 20 },
      { header: 'Application Code', key: 'code', width: 20 },
      { header: 'Names of Applicant', key: 'name', width: 20 },
      { header: 'Address', key: 'address', width: 20 },
      { header: 'Age', key: 'age', width: 20 },
      { header: 'Sex', key: 'sex', width: 20 },
      { header: 'Civil Status', key: 'civil_status', width: 20 },
      { header: 'Religion', key: 'religion', width: 20 },
      { header: 'Disability', key: 'disability', width: 20 },
      { header: 'Ethnicity', key: 'ethnicity', width: 20 },
      { header: 'Email', key: 'email', width: 20 },
      { header: 'Contact #', key: 'contact_number', width: 20 },
      { header: 'Education', key: 'education', width: 20 },
      { header: 'Training', key: 'training', width: 20 },
      { header: 'Experience', key: 'experience', width: 20 },
      { header: 'Eligibility', key: 'eligibility', width: 20 },
      { header: 'Remarks', key: 'remarks', width: 20 }
      // Add more columns based on your data structure
    ]

    // Data for the Excel file
    const data: any[] = []
    list.forEach((item, index) => {
      // For IER Column
      let experience = ''
      let eligibility = ''
      let education = ''
      let training = ''
      item.ier?.forEach((ier) => {
        if (ier.type === 'Experience') {
          experience += `\n ${ier.remarks} (${ier.time})`
        }
        if (ier.type === 'Eligibility') {
          eligibility += `\n ${ier.remarks} (${ier.time})`
        }
        if (ier.type === 'Education') {
          education += `\n ${ier.remarks} (${ier.time})`
        }
        if (ier.type === 'Training') {
          training += `\n ${ier.remarks} (${ier.time})`
        }
      })

      data.push({
        no: index + 1,
        code: `${item.ranking?.code_prefix}-${item.code}`,
        name: `${item.lastname}, ${item.firstname} ${item.middlename}`,
        address: `${item.address}`,
        age: `${item.age}`,
        sex: `${item.sex}`,
        civil_status: `${item.civil_status}`,
        religion: `${item.religion}`,
        disability: `${item.disability}`,
        ethnicity: `${item.ethnicity_detail ?? ''}`,
        email: `${item.email}`,
        contact_number: `${item.contact_number}`,
        education,
        training,
        experience,
        eligibility,
        remarks: `${item.evaluation_status} / ${
          item.reason_for_disqualification ?? ''
        }`
      })
    })

    data.forEach((item) => {
      worksheet.addRow(item)
    })

    // Generate the Excel file
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      saveAs(blob, 'IER.xlsx')
    })
    setDownloading(false)
  }

  // Featch data
  useEffect(() => {
    void fetchData()
  }, [filterRanking])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (
    !hasAccess('rsp_manager') &&
    !hasAccess('hr') &&
    !superAdmins.includes(session.user.email)
  )
    return <Unauthorized />

  return (
    <>
      <Sidebar>
        <RspSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Ranking IER" />
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
                  <th className="app__th">Application Code</th>
                  <th className="app__th">Fullname</th>
                  <th className="app__th">Address</th>
                  <th className="app__th">Religion</th>
                  <th className="app__th">Disability</th>
                  <th className="app__th">Ethnic Group</th>
                  <th className="app__th">Email</th>
                  <th className="app__th">Contact Number</th>
                  <th className="app__th">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item, index) => (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td">{index + 1}.</td>
                      <th className="app__th_firstcol">
                        {item.ranking?.code_prefix}-{item.code}
                      </th>
                      <th className="app__th_firstcol">
                        <div>
                          {item.lastname}, {item.firstname} {item.middlename}
                        </div>
                        <div>
                          {item.age} | {item.sex} | {item.civil_status}
                        </div>
                      </th>
                      <td>{item.address}</td>
                      <td>{item.religion}</td>
                      <td>{item.disability}</td>
                      <td>{item.ethnicity_detail ?? ''}</td>
                      <td>{item.email}</td>
                      <td>{item.contact_number}</td>
                      <td>
                        {item.evaluation_status} /{' '}
                        {item.reason_for_disqualification ?? ''}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={10} rows={2} />}
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
