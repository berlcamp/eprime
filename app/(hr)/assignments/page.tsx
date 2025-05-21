'use client'

import {
  CustomButton,
  DeleteModal,
  PerPage,
  RecordsSideBar,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized,
  UserBlock
} from '@/components/index'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchAssignments } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  PencilSquareIcon,
  PrinterIcon,
  TrashIcon
} from '@heroicons/react/20/solid'
import { format } from 'date-fns'
import React, { Fragment, useEffect, useState } from 'react'
import uuid from 'react-uuid'
import AddEditModal from './AddEditModal'
import Filters from './Filters'
import PrintModal from './PrintModal'
import RevokeModal from './RevokeModal'

// Types
import type { AssignmentTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AssignmentTypes | null>(null)

  const [selectedId, setSelectedId] = useState<string>('')
  const [list, setList] = useState<AssignmentTypes[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterOffice, setFilterOffice] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [editData, setEditData] = useState<AssignmentTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchAssignments(
        { filterKeyword, filterSchool, filterOffice, filterStatus },
        perPageCount,
        0
      )
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
      const result = await fetchAssignments(
        { filterKeyword, filterSchool, filterOffice, filterStatus },
        perPageCount,
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

  const handlePrint = (item: AssignmentTypes) => {
    setSelectedItem(item)
    setShowPrintModal(true)
  }

  const handleEdit = (item: AssignmentTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleRevoke = (item: AssignmentTypes) => {
    setShowRevokeModal(true)
    setEditData(item)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
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
  }, [filterKeyword, perPageCount, filterSchool, filterStatus, filterOffice])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('records') && !superAdmins.includes(session?.user.email ?? ''))
    return <Unauthorized />

  return (
    <>
      <Sidebar>
        <RecordsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Assignments" />
            <CustomButton
              containerStyles="app__btn_green"
              title="Create New Assignment"
              btnType="button"
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterKeyword={setFilterKeyword}
              setFilterSchool={setFilterSchool}
              setFilterOffice={setFilterOffice}
              setFilterStatus={setFilterStatus}
            />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="hidden md:table-cell app__th pl-4"></th>
                  <th className="hidden md:table-cell app__th">
                    Reference Code
                  </th>
                  <th className="hidden md:table-cell app__th">
                    Employee Name
                  </th>
                  <th className="hidden md:table-cell app__th">Type</th>
                  <th className="hidden md:table-cell app__th">Station</th>
                  <th className="hidden md:table-cell app__th">
                    Start/End Date
                  </th>
                  <th className="hidden md:table-cell app__th">Status</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: AssignmentTypes) => (
                    <tr key={uuid()} className="app__tr">
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
                                    onClick={() => handlePrint(item)}
                                    className="app__dropdown_item"
                                  >
                                    <PrinterIcon className="w-4 h-4" />
                                    <span>Print Memo</span>
                                  </div>
                                </Menu.Item>
                                {item.status !== 'Revoked' && (
                                  <>
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
                                        onClick={() => handleRevoke(item)}
                                        className="app__dropdown_item"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                        <span>Revoke</span>
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
                                  </>
                                )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <div className="hidden md:inline-block font-medium">
                          {item.reference_code}
                        </div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div>
                              <UserBlock user={item.hrm_users} />
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Reference Code:
                              </span>{' '}
                              {item.reference_code}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">Type:</span>{' '}
                              {item.type}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Station:{' '}
                              </span>
                              {item.area_assigned === 'school' ? (
                                <span>{item.hrm_schools?.name}</span>
                              ) : (
                                <span>{item.hrm_offices?.name}</span>
                              )}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                From:{' '}
                              </span>
                              {format(new Date(item.from), 'MMM d, yyyy')}
                            </div>
                            {item.to && (
                              <div>
                                <span className="app_td_mobile_label">
                                  To:{' '}
                                </span>
                                {format(new Date(item.to), 'MMM d, yyyy')}
                              </div>
                            )}
                            <div>
                              <span className="app_td_mobile_label">
                                Status:{' '}
                              </span>
                              {item.status === 'Revoked' ? (
                                <span className="app__status_container_red">
                                  Revoked
                                </span>
                              ) : (
                                <span className="app__status_container_green">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        <UserBlock user={item.hrm_users} />
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div className="font-semibold">{item.type}</div>
                        <div>
                          {item.add_to_service_record
                            ? '(Included on Service Record)'
                            : '(Excluded on Service Record)'}
                        </div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div className="font-semibold">
                          {item.area_assigned === 'school' ? (
                            <span>{item.hrm_schools?.name}</span>
                          ) : (
                            <span>{item.hrm_offices?.name}</span>
                          )}
                        </div>
                        <div>{item.hrm_positions?.name}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{format(new Date(item.from), 'MMM d, yyyy')}</div>
                        {item.to && (
                          <div>{format(new Date(item.to), 'MMM d, yyyy')}</div>
                        )}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.status === 'Revoked' ? (
                          <span className="app__status_container_red">
                            Revoked
                          </span>
                        ) : (
                          <span className="app__status_container_green">
                            Active
                          </span>
                        )}
                      </td>
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

      {/* Revoke Modal */}
      {showRevokeModal && (
        <RevokeModal
          editData={editData}
          hideModal={() => setShowRevokeModal(false)}
        />
      )}

      {/* Print Modal */}
      {showPrintModal && selectedItem && (
        <PrintModal
          item={selectedItem}
          hideModal={() => setShowPrintModal(false)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table="hrm_assignments"
          hideModal={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}
export default Page
