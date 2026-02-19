'use client'

import {
  ConfirmModal,
  CustomButton,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { ApplicantTypes } from '@/types'

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
  const [showCommitteePointsModal, setShowCommitteePointsModal] =
    useState(false)
  const [showConfirmAppointModal, setShowConfirmAppointModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null)

  const [list, setList] = useState<ListTypes[]>([])
  const [rankList, setRankList] = useState<ListTypes[]>([])
  const [filterRanking, setFilterRanking] = useState<string>('')
  const [filterDisplay, setFilterDisplay] = useState<string>('')
  const [filterPassingScore, setFilterPassingScore] = useState<string>('50')

  const { hasAccess, setToast } = useFilter()
  const { supabase } = useSupabase()

  const fetchData = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('hrm_ranking_applicants')
        .select(
          '*, ranking:ranking_id(committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
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

          setList(structguredData)
          setRankList(structguredData)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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

  // Filter data by Display
  useEffect(() => {
    setLoading(true)
    if (filterDisplay === 'RQA') {
      const filteredList = rankList.filter(
        (item) => Number(item.overall_score) > Number(filterPassingScore)
      )
      setList(filteredList)
    } else {
      setList(rankList)
    }
    console.log(filterDisplay, filterPassingScore)
    setLoading(false)
  }, [filterDisplay, filterPassingScore])

  // Fetch data
  useEffect(() => {
    setList([])
    setRankList([])
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRanking, refetch])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('rsp_manager')) return <Unauthorized />

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
            <div className="flex items-center space-x-2 py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500">
              <div className="flex-1 text-xs">{`Total results: ${list.length}`}</div>
              <div className="space-x-2">
                <CustomButton
                  containerStyles="app__btn_blue"
                  title="Display Rank List"
                  btnType="button"
                  handleClick={() => setFilterDisplay('Rank List')}
                />
                <CustomButton
                  containerStyles="app__btn_blue"
                  title="Display RQA"
                  btnType="button"
                  handleClick={() => setFilterDisplay('RQA')}
                />
              </div>
              <div className="app__filter_container">
                <CheckIcon className="w-4 h-4 mr-1" />
                <div className="text-xs mr-1">RQA Passing Score:</div>
                <input
                  value={filterPassingScore}
                  type="number"
                  min={0}
                  step="any"
                  onChange={(e) => {
                    const val = e.target.value
                    const num = Number(val)
                    if (val !== '' && (isNaN(num) || num < 0)) return
                    setFilterPassingScore(val)
                  }}
                  className="app__filter_input !w-20"
                />
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
                            {item.applicant.email}
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
                          {hasAccess('sds') &&
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
                                      {avgPoints.toFixed(2)}{' '}
                                    </span>
                                    {/* Display with 2 decimal places */}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="app__td">{item.overall_score}</td>
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
