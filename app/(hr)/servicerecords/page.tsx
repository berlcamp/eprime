'use client'

import {
  CustomButton,
  DeleteModal,
  PerPage,
  RecordsSideBar,
  SearchUserInput,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components/index'
import { PrintServiceRecord } from '@/components/Printables/PrintServiceRecord'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import type { DocumentTypes, Employee, ServiceRecordTypes } from '@/types'
import { fetchServiceRecords } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useReactToPrint } from 'react-to-print'
import AddEditModal from './AddEditModal'

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [perPageCount, setPerPageCount] = useState<number>(10)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editData, setEditData] = useState<ServiceRecordTypes | null>(null)
  const [selectedId, setSelectedId] = useState('')

  // const [noPresent, setNoPresent] = useState<Employee[] | []>([])
  // const { supabase } = useSupabase()

  const [list, setList] = useState<ServiceRecordTypes[]>([])

  const [user, setUser] = useState<Employee | null>(null)

  const [printing, setPrinting] = useState(false)
  const [printItem, setPrintItem] = useState<DocumentTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { hasAccess, session }: { hasAccess: any; session: any } = useFilter()
  const { supabase, systemUsers } = useSupabase()

  const printRef = React.useRef(null)
  const printFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'service-record',
    pageStyle: `@page { size: letter; margin: 0.2in 0.5in 0.5in 0.5in; } html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`
  })

  const handlePrintServiceRecord = async () => {
    if (!user || printing) return
    setPrinting(true)
    try {
      // Place of birth from PDS
      const { data: pds } = await supabase
        .from('hrm_pds')
        .select()
        .eq('user_id', user.id)
        .maybeSingle()

      // All service records for this user
      const { data: sr } = await supabase
        .from('hrm_service_records')
        .select()
        .eq('user_id', user.id)
        .order('from', { ascending: true })

      // Approver = currently logged-in user (enriched with position from context)
      const approver = systemUsers?.find(
        (u: Employee) => u.id === session?.user?.id
      )

      const doc = {
        id: user.id,
        created_at: new Date().toISOString(),
        date_approved: new Date().toISOString(),
        creator: user,
        approver,
        print_place_of_birth: pds?.place_of_birth ?? '',
        print_service_records: sr ?? []
      } as unknown as DocumentTypes

      // Unmount then remount so react-to-print picks up fresh content
      setPrintItem(null)
      setTimeout(() => {
        setPrintItem(doc)
        setTimeout(() => printFn(), 100)
      }, 100)
    } catch (e) {
      console.error(e)
    } finally {
      setPrinting(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)

    if (!user) return

    try {
      const result = await fetchServiceRecords(user.id, perPageCount, 0)

      // update the list in redux
      dispatch(updateList(result.data))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: result.data.length,
          results: result.count ? result.count : 0
        })
      )

      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleShowMore = async () => {
    setLoading(true)

    if (!user) return

    try {
      const result = await fetchServiceRecords(
        user.id,
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

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
    } else {
      setUser(null)
      setList([])
    }
  }

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
  }

  const handleEdit = (item: ServiceRecordTypes) => {
    setShowAddModal(true)
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
  }, [perPageCount])

  // Featch data
  // useEffect(() => {
  //   const fetchNoPresentData = async () => {
  //     // Step 1: Get all user IDs with 'to = present'
  //     const { data: presentRecords, error: presentError } = await supabase
  //       .from('hrm_service_records')
  //       .select('user_id')
  //       .ilike('to', '%present%')

  //     if (presentError) {
  //       console.error('Error fetching present records:', presentError)
  //       return []
  //     }

  //     // Extract user IDs
  //     const presentUserIds = presentRecords.map(
  //       (record: ServiceRecordTypes) => record.user_id
  //     )
  //     const formattedIds = `(${presentUserIds.join(',')})`

  //     // Step 2: Fetch users excluding those with 'to = present'
  //     const { data: users, error: usersError } = await supabase
  //       .from('hrm_users')
  //       .select('*')
  //       .not('id', 'in', formattedIds)

  //     if (usersError) {
  //       console.error('Error fetching users:', usersError)
  //     } else {
  //       setNoPresent(users)
  //     }
  //   }
  //   void fetchNoPresentData()

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  // Featch data
  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  if (
    !hasAccess('records') &&
    !superAdmins.includes(session?.user.email ?? '')
  ) {
    return <Unauthorized />
  }

  return (
    <>
      <Sidebar>
        <RecordsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Service Records" />
          </div>

          {/* Search User Input */}
          <SearchUserInput
            classNames="mx-4 my-4"
            isMultiple={false}
            handleSelectedUsers={handleSelectedUsers}
          />
          {user && !isDataEmpty && !loading && (
            <div className="flex justify-end mx-4 mb-4 space-x-2">
              <CustomButton
                containerStyles="app__btn_blue"
                title={printing ? 'Preparing…' : 'Print Service Record'}
                btnType="button"
                handleClick={handlePrintServiceRecord}
              />
              <CustomButton
                containerStyles="app__btn_green"
                title={`Add New Service Record for ${user.firstname} ${user.middlename} ${user.lastname}`}
                btnType="button"
                handleClick={handleAdd}
              />
            </div>
          )}
          {!user && (
            <div className="text-gray-600 text-center mt-10">
              Search employee above to view service record.
            </div>
          )}
          {user && isDataEmpty && !loading && (
            <div className="text-gray-600 text-center mt-10">
              <div>No service record found for this employee.</div>
              <CustomButton
                containerStyles="app__btn_green mt-4"
                title={`Add New Service Record for ${user.firstname} ${user.middlename} ${user.lastname}`}
                btnType="button"
                handleClick={handleAdd}
              />
            </div>
          )}
          {!isDataEmpty && (
            <>
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
                      <th></th>
                      <th className="hidden md:table-cell text-gray-700 pl-4">
                        Inclusive Dates
                      </th>
                      <th className="hidden md:table-cell app__th">
                        Designation
                      </th>
                      <th className="hidden md:table-cell app__th">
                        Leave without Pay
                      </th>
                      <th className="hidden md:table-cell app__th">Status</th>
                      <th className="hidden md:table-cell app__th">Salary</th>
                      <th className="hidden md:table-cell app__th">
                        Station / Branch
                      </th>
                      <th className="hidden md:table-cell app__th">Remarks</th>
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
                                    {item.status !== 'Revoked' && (
                                      <Menu.Item>
                                        <div
                                          onClick={() => handleEdit(item)}
                                          className="app__dropdown_item"
                                        >
                                          <PencilSquareIcon className="w-4 h-4" />
                                          <span>Edit</span>
                                        </div>
                                      </Menu.Item>
                                    )}
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
                          <th className="app__th_firstcol md:hidden">
                            {/* Mobile View */}
                            <div>
                              <div className="md:hidden app__td_mobile">
                                <div>
                                  <span className="app_td_mobile_label">
                                    From:
                                  </span>{' '}
                                  {item.from}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    To:
                                  </span>{' '}
                                  {item.to}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Designation:
                                  </span>{' '}
                                  {item.designation}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Leave without Pay:
                                  </span>{' '}
                                  {Number(item.days_without_pay) > 0 &&
                                    `${item.days_without_pay} day/s`}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Status:
                                  </span>{' '}
                                  {item.status}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Salary:
                                  </span>{' '}
                                  {item.salary}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Station:
                                  </span>{' '}
                                  {item.station}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Branch:
                                  </span>{' '}
                                  {item.branch}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Separation Date:
                                  </span>{' '}
                                  {item.separation_date}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Separation Cause:
                                  </span>{' '}
                                  {item.separation_cause}
                                </div>
                                <div>
                                  <span className="app_td_mobile_label">
                                    Remarks:
                                  </span>{' '}
                                  {item.remarks}
                                </div>
                              </div>
                            </div>
                            {/* End - Mobile View */}
                          </th>
                          <td className="hidden md:table-cell app__td">
                            <div>From: {item.from}</div>
                            <div>To: {item.to}</div>
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {item.designation}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {Number(item.days_without_pay) > 0 &&
                              `${item.days_without_pay} day/s`}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {item.status}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {item.salary}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            <div>Station: {item.station}</div>
                            <div>Branch: {item.branch}</div>
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {item.remarks}
                          </td>
                        </tr>
                      ))}
                    {loading && <TableRowLoading cols={7} rows={2} />}
                  </tbody>
                </table>
                {isDataEmpty && (
                  <div className="app__norecordsfound">No records found.</div>
                )}
              </div>
              {/* Show More */}
              {resultsCounter.results > resultsCounter.showing && !loading && (
                <ShowMore handleShowMore={handleShowMore} />
              )}
            </>
          )}

          {/* <div className="text-gray-600 text-center mt-10">
            <button className="app__btn_blue">
              View Employees without Present Record
            </button>
          </div>
          <div className="text-gray-600 text-center mt-2">
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th>Employees</th>
                </tr>
              </thead>
              <tbody>
                {noPresent?.map((emp, index) => (
                  <tr key={index} className="app__tr">
                    <td className="app__td">
                      <UserBlock user={emp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div> */}
        </div>
      </div>
      {/* Add/Edit Modal */}
      {showAddModal && user && (
        <AddEditModal
          editData={editData}
          userId={user.id}
          hideModal={() => setShowAddModal(false)}
        />
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table="hrm_service_records"
          hideModal={() => setShowDeleteModal(false)}
        />
      )}
      {/* Hidden print target (CS Form 212 — Service Record). Same layout as
          the tracker's Service Record Print Request output. */}
      {printItem && (
        <PrintServiceRecord selectedItem={printItem} ref={printRef} />
      )}
    </>
  )
}
