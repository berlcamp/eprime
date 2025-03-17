'use client'
import {
  ConfirmModal,
  CustomButton,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components'
import { useFilter } from '@/context/FilterContext'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import React, { Fragment, useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { ApplicantTypes, RankingTypes } from '@/types'

import CommitteePointsModal from '@/components/Rsp/CommitteePointsModal'
import RspSidebar from '@/components/Sidebars/RspSidebar'
import { useSupabase } from '@/context/SupabaseProvider'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'
import { logError } from '@/utils/fetchApi'
import { CheckIcon, EyeIcon } from 'lucide-react'

interface ListTypes {
  applicant: ApplicantTypes
  accumulated_points: Record<string, number> | null
  overall_score: string
}

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refetch, setRefetch] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showCommitteePointsModal, setShowCommitteePointsModal] =
    useState(false)
  const [showConfirmAppointModal, setShowConfirmAppointModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null)

  const [list, setList] = useState<ListTypes[]>([])
  const [rankList, setRankList] = useState<ListTypes[]>([])
  const [originalList, setOriginalList] = useState<ListTypes[] | []>([])
  const [filterRanking, setFilterRanking] = useState<string>('')
  const [filterDisplay, setFilterDisplay] = useState<string>('')

  const [rankingDetails, setRankingDetails] = useState<RankingTypes | null>(
    null
  )

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchMajor, setSearchMajor] = useState('')
  const [majors, setMajors] = useState<string[] | []>([])

  const { hasAccess, setToast } = useFilter()
  const { supabase } = useSupabase()

  const fetchData = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('hrm_ranking_applicants')
        .select(
          '*, ranking:ranking_id(type,passing_score,committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, middlename, lastname, avatar_url, hrm_positions:position_id(name)), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
          {
            count: 'exact'
          }
        )

      // filter ranking
      if (filterRanking !== '') {
        query = query.eq('ranking_id', filterRanking)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      if (filterRanking !== '') {
        if (data.length > 0) {
          const structguredData: ListTypes[] = []
          data.forEach((d: ApplicantTypes) => {
            const accumulatedPoints: Record<string, number> | null =
              CommitteeAccumulatedPoints(d.id, d.ranking.committees)

            structguredData.push({
              applicant: d,
              accumulated_points: accumulatedPoints,
              overall_score: accumulatedPoints
                ? Object.values(accumulatedPoints)
                    .reduce((sum: number, points) => sum + points, 0)
                    .toFixed(2)
                : ''
            })
          })

          // Sort structguredData by overall_score in descending order
          structguredData.sort((a, b) => {
            const scoreA = parseFloat(a.overall_score || '0')
            const scoreB = parseFloat(b.overall_score || '0')
            return scoreB - scoreA // Sort in descending order
          })

          // Extract unique majors using Array.from() to avoid spread operator issues
          const uniqueMajors = Array.from(
            new Set(
              structguredData.map((item) => item.applicant.specific_major)
            )
          )

          setMajors(uniqueMajors)

          setList(structguredData)
          setOriginalList(structguredData)

          setRankList(structguredData)

          // get the ranking details so we can use the passing score
          setRankingDetails(structguredData[0].applicant.ranking)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchApplicant = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const searchTerm = e.target.value
    setSearchKeyword(searchTerm)

    if (searchTerm.trim().length < 3) {
      setList(originalList)
      return
    }

    // Search user
    const searchWords = e.target.value.split(' ')
    const results = list.filter((user) => {
      const fullName =
        `${user.applicant.firstname} ${user.applicant.middlename} ${user.applicant.lastname}`.toLowerCase()
      return searchWords.every((word) => fullName.includes(word.toLowerCase()))
    })

    setList(results)
  }
  const handleSearchMajor = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const searchTerm = e.target.value
    setSearchMajor(searchTerm)

    if (searchTerm.trim() !== '') {
      const filteredArr = originalList.filter(
        (item) => item.applicant.specific_major === searchTerm
      )
      setList(filteredArr)
    } else {
      setList(originalList)
    }
  }

  const handleViewCommitteePoints = (item: ApplicantTypes) => {
    setShowCommitteePointsModal(true)
    setSelectedItem(item)
  }

  const handleAppoint = (item: ApplicantTypes) => {
    setShowConfirmAppointModal(true)
    setSelectedItem(item)
  }

  const handleConfirmedAppoint = async () => {
    if (saving || !selectedItem) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .update({
          status: 'Appointed'
        })
        .eq('id', selectedItem.id)

      if (error) {
        void logError(
          'Appoint applicant',
          'hrm_ranking_applicants',
          '',
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)
      setShowConfirmAppointModal(false)
      setRefetch(!refetch)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownloadExcel = async (type: string) => {
    setDownloading(true)

    const passingScore = rankingDetails?.passing_score ?? 50

    let list = rankList
    if (type === 'RQA') {
      const filteredList = rankList.filter(
        (item) => Number(item.overall_score) > Number(passingScore)
      )
      list = filteredList
    }

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
      { header: 'No.', key: 'number', width: 10 },
      { header: 'Names of Applicant', key: 'name', width: 25 },
      { header: 'Applicant Code', key: 'code', width: 25 },
      ...allKeys.map((key) => ({ header: key, key, width: 15 })), // Dynamic columns
      { header: 'Total', key: 'overall_score', width: 15 },
      { header: 'remarks', key: 'remarks', width: 15 },
      { header: 'For Background Investigation (Yes)', key: 'yes', width: 15 },
      { header: 'For Background Investigation (No)', key: 'no', width: 15 },
      {
        header:
          'For Appointment (To be filled out by the appointing Officer/Authority, Please sign opposite the name of the applicant)',
        key: 'status1',
        width: 15
      },
      {
        header:
          'Status of Appointment (Based on availability of PBET/LET/LEPT)',
        key: 'status2',
        width: 15
      }
    ]

    // Data for the Excel file
    const data: any[] = list.map((item, index) => ({
      number: index + 1,
      name: `${item.applicant.lastname}, ${item.applicant.firstname} ${item.applicant.middlename}`,
      code: `${item.applicant.code}`,
      ...allKeys.reduce<Record<string, any>>((acc, key) => {
        acc[key] = item.accumulated_points?.[key] ?? '-' // Use "-" if value is missing
        return acc
      }, {}),
      overall_score: item.overall_score,
      remarks: '',
      yes: '',
      no: '',
      status1: '',
      status2: ''
    }))

    data.push({ name: '' })
    data.push({ name: 'Confirmed Committee Members:' })
    rankingDetails?.committees.forEach((c) => {
      if (c.type === 'Original Member' && c.status === 'Confirmed') {
        data.push({
          name: `${c.hrm_user.firstname} ${c.hrm_user.middlename ?? ''} ${
            c.hrm_user.lastname
          } / ${c.hrm_user.hrm_positions?.name}`
        })
      }
    })

    // Add data to the worksheet
    data.forEach((item) => worksheet.addRow(item))

    // Generate the Excel file
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      saveAs(blob, 'Ranking-Results.xlsx')
    })
    setDownloading(false)
  }

  // Filter data by Display
  useEffect(() => {
    setLoading(true)
    const passingScore = rankingDetails?.passing_score ?? 50

    if (filterDisplay === 'RQA') {
      const filteredList = rankList.filter(
        (item) => Number(item.overall_score) > Number(passingScore)
      )
      setList(filteredList)
    } else {
      setList(rankList)
    }

    setLoading(false)
  }, [filterDisplay, rankingDetails])

  // Fetch data
  useEffect(() => {
    setList([])
    setRankList([])
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRanking, refetch])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('rsp_manager') && !hasAccess('hr') && !hasAccess('sds'))
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
            <Title title="Ranking Results" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterRanking={setFilterRanking} />
          </div>

          {rankList.length > 0 && (
            <div className="flex space-x-2 px-4 py-4 w-full md:w-1/2">
              <input
                placeholder="Search applicant"
                type="text"
                value={searchKeyword}
                onChange={handleSearchApplicant}
                className="app__input_standard"
              />
              <select
                value={searchMajor}
                onChange={handleSearchMajor}
                className="app__input_standard"
              >
                <option value="">All Major</option>
                {majors.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {rankList.length > 0 && (
            <div className="flex items-center space-x-2 py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500">
              <div className="flex-1 text-xs">{`Total results: ${list.length}`}</div>
              <div className="space-x-2">
                <CustomButton
                  containerStyles="app__btn_green"
                  title={downloading ? 'Downloading...' : 'Download Rank List'}
                  btnType="button"
                  handleClick={() => handleDownloadExcel('Rank List')}
                />
                <CustomButton
                  containerStyles="app__btn_green"
                  title={`Download ${rankingDetails?.type}`}
                  btnType="button"
                  handleClick={() => handleDownloadExcel('RQA')}
                />
                <CustomButton
                  containerStyles="app__btn_blue"
                  title="Display Rank List"
                  btnType="button"
                  handleClick={() => setFilterDisplay('Rank List')}
                />
                <CustomButton
                  containerStyles="app__btn_blue"
                  title={`Display ${rankingDetails?.type}`}
                  btnType="button"
                  handleClick={() => setFilterDisplay('RQA')}
                />
              </div>
              <div className="app__filter_container">
                <CheckIcon className="w-4 h-4 mr-1" />
                <div className="text-xs">
                  {rankingDetails?.type.includes('RQA') ? 'RQA' : 'CAR'} Passing
                  Score: {rankingDetails?.passing_score}
                </div>
              </div>
            </div>
          )}

          {filterRanking === '' && (
            <div className="mt-10 text-center text-xl font-light text-gray-600">
              Choose ranking from filters above.
            </div>
          )}

          {/* Main Content */}
          {rankList.length > 0 && (
            <div>
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th pl-4"></th>
                    <th className="app__th w-[300px]">Applicant</th>
                    <th className="app__th w-40"></th>
                    <th className="app__th">Accumulated Points</th>
                    <th className="app__th">Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {!isDataEmpty &&
                    list.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="w-6 pl-4 app__td">
                          <Menu as="div" className="app__menu_container">
                            <div>
                              <Menu.Button className="app__dropdown_btn">
                                <ChevronDownIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </Menu.Button>
                            </div>

                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="app__dropdown_items">
                                <div className="py-1">
                                  <Menu.Item>
                                    <div
                                      onClick={() =>
                                        handleViewCommitteePoints(
                                          item.applicant
                                        )
                                      }
                                      className="app__dropdown_item"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                      <span>View Committee Points</span>
                                    </div>
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                        <th className="app__th_firstcol">
                          <div className="font-medium">
                            {item.applicant.lastname},{' '}
                            {item.applicant.firstname}{' '}
                            {item.applicant.middlename}
                          </div>
                          <div className="font-light">
                            Address: {item.applicant.address}
                          </div>
                          <div className="font-light">
                            Application Code: {item.applicant.code}
                          </div>
                          <div className="font-light">
                            Major: {item.applicant.specific_major}
                          </div>
                          {item.applicant.current_employee === 'Yes' && (
                            <div className="font-bold">
                              (Current DepEd Employee)
                            </div>
                          )}
                          {item.applicant.previous_applicant === 'Yes' && (
                            <div className="font-bold">
                              (Previous Applicant)
                            </div>
                          )}
                        </th>
                        <td className="app__td">
                          {(hasAccess('sds') || hasAccess('settings')) &&
                            item.applicant.status !== 'Appointed' && (
                              <CustomButton
                                containerStyles="app__btn_blue"
                                title="Appoint"
                                btnType="button"
                                handleClick={() =>
                                  handleAppoint(item.applicant)
                                }
                              />
                            )}
                          {item.applicant.status === 'Appointed' && (
                            <span className="font-bold text-lg">Appointed</span>
                          )}
                        </td>
                        <td className="app__td">
                          {item.accumulated_points && (
                            <div>
                              {Object.entries(item.accumulated_points).map(
                                ([criteriaName, avgPoints]) => (
                                  <div key={criteriaName}>
                                    <span>{criteriaName}:</span>
                                    <span className="font-bold">
                                      {' '}
                                      {avgPoints.toFixed(3)}{' '}
                                    </span>
                                    {/* Display with 2 decimal places */}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="app__td">
                          {Number(item.overall_score).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  {loading && <TableRowLoading cols={4} rows={2} />}
                </tbody>
              </table>
              {!loading && isDataEmpty && (
                <div className="app__norecordsfound">No results.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Show Casted Points Modal */}
      {showCommitteePointsModal && selectedItem && (
        <CommitteePointsModal
          applicantData={selectedItem}
          hideModal={() => setShowCommitteePointsModal(false)}
        />
      )}

      {/* Disapprove Confirmation Modal */}
      {showConfirmAppointModal && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message="Are you sure you want to appoint this employee?"
          onConfirm={handleConfirmedAppoint}
          onCancel={() => setShowConfirmAppointModal(false)}
        />
      )}
    </>
  )
}
export default Page
