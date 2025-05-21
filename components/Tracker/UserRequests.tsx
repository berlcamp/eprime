'use client'

import {
  CustomButton,
  PerPage,
  ShowMore,
  TableRowLoading,
  Title,
  UserBlock
} from '@/components/index'
import DetailsModal from '@/components/Tracker/DetailsModal'
import { format } from 'date-fns'

import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  PrinterIcon,
  TagIcon
} from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'
// Types
import type { DocumentTypes } from '@/types'

// Redux imports
import AddDocumentModal from '@/app/(hr)/tracker/AddDocumentModal'
import { requestTypes } from '@/constants'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useReactToPrint } from 'react-to-print'
import { PrintLeaveForm } from '../Printables/PrintLeaveForm'
import { PrintLocatorSlipForm } from '../Printables/PrintLocatorSlipForm'
import { PrintPassSlipForm } from '../Printables/PrintPassSlipForm'
import { PrintTravelForm } from '../Printables/PrintTravelForm'
import { PrintUndertimeForm } from '../Printables/PrintUndertimeForm'

export default function UserRequests({
  forDashboard,
  userId
}: {
  forDashboard: boolean
  userId: string
}) {
  const [loading, setLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)
  const [filterType, setFilterType] = useState('')
  const [clear, setClear] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [list, setList] = useState<DocumentTypes[]>([])
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [showingCount, setShowingCount] = useState<number>(0)
  const [resultsCount, setResultsCount] = useState<number>(0)
  const [refresh, setRefresh] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)

  const { supabase, session } = useSupabase()

  const componentRef = React.useRef(null)
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'request-form'
  })

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('hrm_request_trackers')
        .select(
          '*,leave_cocs:hrm_leave_coc(*), leave_dates:hrm_leave_dates(*), hrm_request_tracker_stickies(*), hrm_tracker_followers(*),creator:created_by(id,firstname,lastname,middlename,gender,step_increment_leave_days,avatar_url,hrm_positions:position_id(name),position_type,hrm_item:item_id(actual_annual_salary,hrm_position:position_id(name))),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url),recommender:recommended_by(id,firstname,lastname,middlename,avatar_url),certifier:certified_by(id,firstname,lastname,middlename,avatar_url),finalapprover:approved_by(id,firstname,lastname,middlename,avatar_url),hrm_remarks(*)',
          { count: 'exact' }
        )

      if (!clear) {
        // Filter type
        if (filterType !== '') {
          query = query.eq('type', filterType)
        }

        if (filterStatus !== '') {
          query = query.eq('current_status', filterStatus)
        }
      }

      if (forDashboard) {
        query = query.eq('receiver_id', userId)
        query = query.neq('current_status', 'Approved')
        query = query.neq('current_status', 'Cancelled')
        query = query.neq('current_status', 'Disapproved')
      } else {
        query = query.eq('created_by', userId)
      }

      // Per Page from context
      const from = 0
      const to = from + (perPageCount - 1)
      // Per Page from context
      query = query.range(from, to)

      // Order By
      query = query.order('id', { ascending: true })

      const { data, count, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // update the list in redux
      dispatch(updateList(data))

      setResultsCount(count || 0)
      setShowingCount(data.length)
    } catch (error) {
      console.error('fetch error xx', error)
    }
    setLoading(false)
  }

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('hrm_request_trackers')
        .select(
          '*,leave_cocs:hrm_leave_coc(*), leave_dates:hrm_leave_dates(*), hrm_request_tracker_stickies(*), hrm_tracker_followers(*),creator:created_by(id,firstname,lastname,middlename,gender,step_increment_leave_days,avatar_url,hrm_positions:position_id(name),position_type,hrm_item:item_id(actual_annual_salary,hrm_position:position_id(name))),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url),recommender:recommended_by(id,firstname,lastname,middlename,avatar_url),certifier:certified_by(id,firstname,lastname,middlename,avatar_url),finalapprover:approved_by(id,firstname,lastname,middlename,avatar_url),hrm_remarks(*)',
          { count: 'exact' }
        )

      if (!clear) {
        // Filter type
        if (filterType !== '') {
          query = query.eq('type', filterType)
        }

        if (filterStatus !== '') {
          query = query.eq('current_status', filterStatus)
        }
      }

      if (forDashboard) {
        query = query.eq('receiver_id', userId)
        query = query.neq('current_status', 'Approved')
        query = query.neq('current_status', 'Cancelled')
        query = query.neq('current_status', 'Disapproved')
      } else {
        query = query.eq('created_by', userId)
      }

      // Per Page from context
      const from = list.length
      const to = from + (perPageCount - 1)
      // Per Page from context
      query = query.range(from, to)

      // Order By
      query = query.order('id', { ascending: false })

      const { data, count, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // update the list in redux
      const newList = [...list, ...data]
      dispatch(updateList(newList))

      setResultsCount(count || 0)
      setShowingCount(newList.length)
    } catch (error) {
      console.error('fetch error xx', error)
    }
    setLoading(false)
  }

  const handlePrint = (item: DocumentTypes) => {
    setSelectedItem(null) // Temporarily set selectedItem to null to unmount the content
    setTimeout(() => {
      setSelectedItem(item) // Set the new item after a short delay
      setTimeout(() => {
        printFn() // Trigger the print function after re-rendering the new content
      }, 100) // Adjust this delay if needed
    }, 100) // This delay ensures the unmounting and re-rendering are separated
  }

  const handleShowDetailsModal = (item: DocumentTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
  }

  const handleClear = () => {
    if (filterStatus === '' && filterType === '') return

    setFilterStatus('')
    setFilterType('')
    setClear(!clear)
  }

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPageCount, clear])

  // Update list whenever list in redux updates
  useEffect(() => {
    setList([])
    setList(globallist)
  }, [globallist])

  useEffect(() => {
    setList([])
    void fetchData()
  }, [refresh])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list
  return (
    <div className="mt-4">
      {!forDashboard && (
        <>
          <div className="app__title">
            <Title title="Requests" />
            {userId === session?.user.id && (
              <CustomButton
                containerStyles="app__btn_green"
                title="Create New Request"
                btnType="button"
                handleClick={() => setShowAddModal(true)}
              />
            )}
          </div>

          <div className="app__warning_text">
            You can create your request here such as Leave Request, Travel
            Authority, Pass Slips, Undertime Permit, Locator Slip, and Service
            Record Print Request.
          </div>

          {/* Filters */}
          <div className="app__filters">
            <div className="">
              <div className="items-center space-y-2 space-x-1">
                <form
                  onSubmit={fetchData}
                  className="inline-flex items-center app__filter_field_container"
                >
                  <div className="items-center space-y-1">
                    <div className="app__filter_container">
                      <TagIcon className="w-4 h-4 mr-1" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="app__filter_select"
                      >
                        <option value="">Type:</option>
                        {requestTypes.map((type, index) => (
                          <option key={index} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="app__filter_container">
                      <TagIcon className="w-4 h-4 mr-1" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="app__filter_select"
                      >
                        <option value="">Status:</option>
                        <option value="Approved">Approved</option>
                        <option value="Approval Recommended">
                          Approval Recommended
                        </option>
                        <option value="For Verification">
                          For Verification
                        </option>
                        <option value="Disapproved">Disapproved</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <CustomButton
                  containerStyles="app__btn_green"
                  title="Apply Filter"
                  btnType="button"
                  handleClick={fetchData}
                />
                <CustomButton
                  containerStyles="app__btn_gray"
                  title="Clear Filter"
                  btnType="button"
                  handleClick={handleClear}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Per Page */}
      <PerPage
        showingCount={showingCount}
        resultsCount={resultsCount}
        perPageCount={perPageCount}
        setPerPageCount={setPerPageCount}
      />

      {/* Main Content */}
      <div>
        <table className="app__table">
          <thead className="app__thead">
            <tr>
              <th className="app__th pl-4"></th>
              <th className="app__th w-16"></th>
              <th className="app__th">Reference Code</th>
              <th className="app__th">Request Type</th>
              <th className="hidden sm:table-cell app__th">Details</th>
              <th className="hidden sm:table-cell app__th">Requester</th>
              <th className="hidden sm:table-cell app__th">Current Status</th>
            </tr>
          </thead>
          <tbody>
            {!isDataEmpty &&
              list.map((item: DocumentTypes, index: number) => (
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
                            {[
                              'Leave',
                              'Locator Slip',
                              'Pass Slip',
                              'Undertime Permit',
                              'Service Record Print Request',
                              'Travel Authority'
                            ].includes(item.type) &&
                              item.current_status === 'Approved' && (
                                <Menu.Item>
                                  <div
                                    onClick={() => handlePrint(item)}
                                    className="app__dropdown_item"
                                  >
                                    <PrinterIcon className="w-4 h-4" />
                                    <span>Print Form</span>
                                  </div>
                                </Menu.Item>
                              )}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </td>
                  <td className="pl-4 app__td">
                    <div>
                      <button
                        onClick={() => handleShowDetailsModal(item)}
                        className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                      >
                        Request&nbsp;Details
                      </button>
                    </div>
                  </td>
                  <td className="app__td">
                    <div className="font-medium">{item.reference_code}</div>
                  </td>
                  <td className="app__td">
                    <div className="font-medium">{item.type}</div>
                  </td>
                  <td className="hidden sm:table-cell app__td">
                    {item.particulars && item.particulars.trim() !== '' && (
                      <div>
                        <span className="font-light">Particulars:</span>{' '}
                        <span className="font-medium">{item.particulars}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-light">Date Requested:</span>{' '}
                      <span className="font-medium">
                        {format(
                          new Date(item.created_at),
                          'MMM dd, yyyy h:mm a'
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell app__td">
                    {item.creator && <UserBlock user={item.creator} />}
                  </td>
                  <td className="hidden sm:table-cell app__td">
                    {item.current_status === 'Cancelled' && (
                      <span className="text-blue-700 px-1 bg-blue-100 border border-blue-500 font-medium">
                        {item.current_status}
                      </span>
                    )}
                    {item.current_status === 'Approval Recommended' && (
                      <span className="text-green-700 px-1 bg-green-100 border border-green-500 font-medium">
                        {item.current_status}
                      </span>
                    )}
                    {item.current_status === 'Approved' && (
                      <span className="text-green-900 px-1 bg-green-300 border border-green-700 font-medium">
                        {item.current_status}
                      </span>
                    )}
                    {item.current_status === 'Disapproved' && (
                      <span className="text-red-700 px-1 bg-red-100 border border-red-500 font-medium">
                        {item.current_status}
                      </span>
                    )}
                    {item.current_status === 'For Verification' && (
                      <span className="text-orange-700 px-1 bg-orange-100 border border-orange-500 font-medium">
                        {item.current_status}
                      </span>
                    )}
                    {item.approver && (
                      <div className="mt-1">
                        by {item.approver.firstname} {item.approver.middlename}{' '}
                        {item.approver.lastname}
                      </div>
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
      {resultsCount > showingCount && !loading && (
        <ShowMore handleShowMore={handleShowMore} />
      )}
      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <DetailsModal
          refresh={() => setRefresh(!refresh)}
          documentData={selectedItem}
          hideModal={() => setShowDetailsModal(false)}
        />
      )}
      {/* Add Document Modal */}
      {showAddModal && (
        <AddDocumentModal hideModal={() => setShowAddModal(false)} />
      )}
      {/* Print Leave */}
      {selectedItem && selectedItem.type === 'Leave' && (
        <PrintLeaveForm selectedItem={selectedItem} ref={componentRef} />
      )}
      {/* Print Locator Slip */}
      {selectedItem && selectedItem.type === 'Locator Slip' && (
        <PrintLocatorSlipForm selectedItem={selectedItem} ref={componentRef} />
      )}
      {/* Print Pass Slip */}
      {selectedItem && selectedItem.type === 'Pass Slip' && (
        <PrintPassSlipForm selectedItem={selectedItem} ref={componentRef} />
      )}
      {/* Print Undertime Permit */}
      {selectedItem && selectedItem.type === 'Undertime Permit' && (
        <PrintUndertimeForm selectedItem={selectedItem} ref={componentRef} />
      )}
      {/* Print Travel Form */}
      {selectedItem && selectedItem.type === 'Travel Authority' && (
        <PrintTravelForm selectedItem={selectedItem} ref={componentRef} />
      )}
    </div>
  )
}
