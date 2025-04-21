'use client'

import {
  CustomButton,
  DeleteModal,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components/index'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { RankingExpensesSummaryTypes, SignatoriesTypes } from '@/types'

// Redux imports
import RspSidebar from '@/components/Sidebars/RspSidebar'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { fetchRankingExpenses } from '@/utils/fetchApi'
import { PrinterIcon } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useReactToPrint } from 'react-to-print'
import AddEditModal from './AddEditModal'
import { PrintSummary } from './PrintSummary'
import SignatoriesModal from './SignatoriesModal'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSignatoriesModal, setShowSignatoriesModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [signatories, setSignatories] = useState<SignatoriesTypes | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')

  const [list, setList] = useState<RankingExpensesSummaryTypes[]>([])
  const [filterRanking, setFilterRanking] = useState<string>('')

  const [editData, setEditData] = useState<RankingExpensesSummaryTypes | null>(
    null
  )

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const componentRef = React.useRef(null)
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Expenses Summary'
  })

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchRankingExpenses({ filterRanking }, 100, 0)
      // update the list in redux
      dispatch(updateList(result.data))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: result.data.length,
          results: result.count ? result.count : 0
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true)

    try {
      const result = await fetchRankingExpenses(
        { filterRanking },
        100,
        list.length
      )

      // update the list in redux
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: newList.length,
          results: result.count ? result.count : 0
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
  }

  const handleEdit = (item: RankingExpensesSummaryTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const handleInitiatePrint = () => {
    setShowSignatoriesModal(true)
  }

  const handlePrint = (signatories: SignatoriesTypes) => {
    setSignatories(null) // Temporarily set selectedItem to null to unmount the content
    setTimeout(() => {
      setSignatories(signatories) // Set the new item after a short delay
      setTimeout(() => {
        printFn() // Trigger the print function after re-rendering the new content
      }, 100) // Adjust this delay if needed
    }, 100) // This delay ensures the unmounting and re-rendering are separated
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRanking])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('rsp_manager') && !superAdmins.includes(session.user.email))
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
            <Title title="Summary of Expenses" />
            <CustomButton
              containerStyles="app__btn_green"
              title="Create New Summary"
              btnType="button"
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterRanking={setFilterRanking} />
          </div>

          {!isDataEmpty && (
            <div className="flex items-center space-x-2 py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500">
              <div className="flex-1 text-xs">Total Amount: 2</div>
              <div className="space-x-2">
                <CustomButton
                  containerStyles="app__btn_blue"
                  title="Print"
                  btnType="button"
                  handleClick={handleInitiatePrint}
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th pl-4"></th>
                  <th className="app__th">Ranking</th>
                  <th className="app__th">Particulars</th>
                  <th className="app__th">No. of Applicants</th>
                  <th className="app__th">Unit Cost/Hourly Rate</th>
                  <th className="app__th">
                    Time Spent (per applicant in hours)
                  </th>
                  <th className="app__th">Amount</th>
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
                                    onClick={handleInitiatePrint}
                                    className="app__dropdown_item"
                                  >
                                    <PrinterIcon className="w-4 h-4" />
                                    <span>Print Summary</span>
                                  </div>
                                </Menu.Item>

                                <Menu.Item>
                                  <div
                                    onClick={() => handleEdit(item)}
                                    className="app__dropdown_item"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Edit</span>
                                  </div>
                                </Menu.Item>

                                <Menu.Item>
                                  <div
                                    onClick={() => handleDelete(item.id)}
                                    className="app__dropdown_item"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    <span>Delete</span>
                                  </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        {item.ranking?.position?.name}
                        {item.ranking?.type} - {item.ranking?.year}
                      </th>
                      <td>{item.particulars}</td>
                      <td>{item.total_applicants}</td>
                      <td>{item.unit_cost}</td>
                      <td>{item.time_spent_per_applicant}</td>
                      <td>{Number(item.amount) !== 0 ? item.amount : ''}</td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={7} rows={2} />}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddEditModal
          editData={editData}
          hideModal={() => setShowAddModal(false)}
        />
      )}
      {/* Signatories Modal */}
      {showSignatoriesModal && (
        <SignatoriesModal
          hideModal={() => setShowSignatoriesModal(false)}
          modalData={(signatories) => {
            void handlePrint(signatories)
          }}
        />
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table="hrm_ranking_expenses_summary"
          hideModal={() => setShowDeleteModal(false)}
        />
      )}
      {/* Print Container */}
      {!isDataEmpty && signatories && (
        <PrintSummary
          selectedItems={list}
          signatories={signatories}
          ref={componentRef}
        />
      )}
    </>
  )
}
export default Page
