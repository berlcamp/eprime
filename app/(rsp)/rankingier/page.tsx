'use client'

import {
  CustomButton,
  Sidebar,
  TableError,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components/index'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { runListQuery, type QueryError } from '@/utils/query-result'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type {
  ApplicantDocuments,
  ApplicantIerTypes,
  ApplicantTypes
} from '@/types'

// Redux imports
import RspSidebar from '@/components/Sidebars/RspSidebar'

/** The four columns the IER report has always had. */
const ierTypes = ['Education', 'Training', 'Eligibility', 'Experience'] as const

/** The order the report -- both the table and the export -- prints them in. */
const ierColumnOrder: IerColumn[] = [
  'Education',
  'Training',
  'Experience',
  'Eligibility'
]

type IerColumn = (typeof ierTypes)[number] | 'Other'

/**
 * Buckets an applicant's IER entries by type.
 *
 * The export used to test each entry against the four names and drop whatever
 * matched none, so an entry saved with no type -- or with one this list has
 * since stopped using -- left the report with no sign it had been omitted.
 * Those land in "Other" instead, which the page shows only when some entry
 * needs it.
 */
const groupIer = (
  ier: ApplicantIerTypes[] | undefined
): Record<IerColumn, ApplicantIerTypes[]> => {
  const groups: Record<IerColumn, ApplicantIerTypes[]> = {
    Education: [],
    Training: [],
    Eligibility: [],
    Experience: [],
    Other: []
  }

  ier?.forEach((entry) => {
    const column = ierTypes.find((type) => type === entry.type)
    groups[column ?? 'Other'].push(entry)
  })

  return groups
}

/** `remarks (time) (status)`, skipping the parts the evaluator left blank. */
const formatIerEntry = (entry: ApplicantIerTypes): string =>
  [
    entry.remarks?.trim() ?? '',
    entry.time?.trim() ? `(${entry.time.trim()})` : '',
    entry.status?.trim() ? `(${entry.status.trim()})` : ''
  ]
    .filter((part) => part !== '')
    .join(' ')

/** One numbered entry per line, the way the applicant modal lists them. */
const formatIerCell = (entries: ApplicantIerTypes[]): string =>
  entries.map((entry, i) => `${i + 1}. ${formatIerEntry(entry)}`).join('\n')

/**
 * Remarks an evaluator typed against a submitted document. They live on
 * `hrm_ranking_applicant_documents`, not on the IER table, so until now they
 * appeared nowhere in this report.
 */
const documentRemarks = (
  documents: ApplicantDocuments[] | undefined
): ApplicantDocuments[] =>
  (documents ?? []).filter((doc) => doc.remarks?.trim() !== '')

const formatDocumentRemarks = (
  documents: ApplicantDocuments[] | undefined
): string =>
  documentRemarks(documents)
    .map((doc, i) => `${i + 1}. ${doc.remarks.trim()} (${doc.status})`)
    .join('\n')

/** One numbered line per entry, matching the applicant modal's IER table. */
const IerEntries = ({ entries }: { entries: ApplicantIerTypes[] }) => {
  if (entries.length === 0)
    return <span className="text-gray-400">&mdash;</span>

  return (
    <div className="space-y-1">
      {entries.map((entry, i) => (
        <div key={entry.id}>
          {i + 1}. {formatIerEntry(entry)}
        </div>
      ))}
    </div>
  )
}

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<ApplicantTypes[]>([])
  const [loadError, setLoadError] = useState<QueryError | null>(null)
  const [filterRanking, setFilterRanking] = useState<string>('')
  const [downloading, setDownloading] = useState(false)

  const { session, supabase } = useSupabase()
  const { hasAccess } = useFilter()

  const fetchData = async () => {
    if (filterRanking === '') return

    setLoading(true)

    try {
      const result = await runListQuery<any>(
        {
          transaction: 'Fetch IER applicants',
          table: 'hrm_ranking_applicants',
          payload: { rankingId: filterRanking }
        },
        supabase
          .from('hrm_ranking_applicants')
          .select(
            '*,ier:hrm_ranking_applicant_ier(*),applicant_documents:hrm_ranking_applicant_documents(id,status,remarks,document_url),ranking:ranking_id(code_prefix)',
            {
              count: 'exact'
            }
          )
          .eq('ranking_id', filterRanking)
          .order('ranking_id', { ascending: true })
          // Without this the embedded entries come back in whatever order
          // Postgres happened to return, so the same applicant's remarks
          // reshuffle between one download and the next.
          .order('id', {
            referencedTable: 'hrm_ranking_applicant_ier',
            ascending: true
          })
          .order('id', {
            referencedTable: 'hrm_ranking_applicant_documents',
            ascending: true
          })
      )

      // Falling back to an empty list read as "no applicants in this ranking".
      if (!result.ok) {
        setLoadError(result.error)
        return
      }

      setLoadError(null)
      setList(result.data)
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
      ...(
        [
          { header: 'Education', key: 'education' },
          { header: 'Training', key: 'training' },
          { header: 'Experience', key: 'experience' },
          { header: 'Eligibility', key: 'eligibility' },
          { header: 'Other IER Entries', key: 'other' },
          { header: 'Document Remarks', key: 'document_remarks' }
        ] as const
      ).map((column) => ({
        ...column,
        width: 40,
        // An applicant's entries are one per line. Without wrapping, Excel
        // shows the first line only and the rest read as missing.
        style: { alignment: { wrapText: true, vertical: 'top' as const } }
      })),
      { header: 'Evaluation Result', key: 'remarks', width: 20 }
      // Add more columns based on your data structure
    ]

    // Data for the Excel file
    const data: any[] = []
    list.forEach((item, index) => {
      // For IER Column
      const ier = groupIer(item.ier)

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
        education: formatIerCell(ier.Education),
        training: formatIerCell(ier.Training),
        experience: formatIerCell(ier.Experience),
        eligibility: formatIerCell(ier.Eligibility),
        other: formatIerCell(ier.Other),
        document_remarks: formatDocumentRemarks(item.applicant_documents),
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

  // The four named columns cover every entry the current form can produce, so
  // the extra column only appears for a ranking that actually has stragglers.
  const rows = list.map((item) => ({
    item,
    ier: groupIer(item.ier),
    documents: documentRemarks(item.applicant_documents)
  }))
  const hasOtherIer = rows.some((row) => row.ier.Other.length > 0)
  const columnCount = hasOtherIer ? 16 : 15

  // Check access from permission settings or Super Admins
  if (
    !hasAccess('rsp_manager') &&
    !hasAccess('hr') &&
    !superAdmins.includes(session?.user.email ?? '')
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
          <div className="overflow-x-auto">
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
                  <th className="app__th min-w-[12rem]">Education</th>
                  <th className="app__th min-w-[12rem]">Training</th>
                  <th className="app__th min-w-[12rem]">Experience</th>
                  <th className="app__th min-w-[12rem]">Eligibility</th>
                  {hasOtherIer && (
                    <th className="app__th min-w-[12rem]">Other IER Entries</th>
                  )}
                  <th className="app__th min-w-[12rem]">Document Remarks</th>
                  <th className="app__th">Evaluation Result</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  rows.map(({ item, ier, documents }, index) => (
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
                      <td className="app__td">{item.address}</td>
                      <td className="app__td">{item.religion}</td>
                      <td className="app__td">{item.disability}</td>
                      <td className="app__td">{item.ethnicity_detail ?? ''}</td>
                      <td className="app__td">{item.email}</td>
                      <td className="app__td">{item.contact_number}</td>
                      {(hasOtherIer
                        ? [...ierColumnOrder, 'Other' as IerColumn]
                        : ierColumnOrder
                      ).map((column) => (
                        <td key={column} className="app__td">
                          <IerEntries entries={ier[column]} />
                        </td>
                      ))}
                      <td className="app__td">
                        {documents.length === 0 && (
                          <span className="text-gray-400">&mdash;</span>
                        )}
                        <div className="space-y-1">
                          {documents.map((doc, i) => (
                            <div key={doc.id}>
                              {i + 1}. {doc.remarks.trim()}{' '}
                              <span className="text-gray-500">
                                ({doc.status})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="app__td">
                        {item.evaluation_status} /{' '}
                        {item.reason_for_disqualification ?? ''}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={columnCount} rows={2} />}
              </tbody>
            </table>
            {loadError && (
              <TableError error={loadError} onRetry={() => {
                  void fetchData()
                }} />
            )}
            {!loading && !loadError && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
