'use client'

import {
  CustomButton,
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  TrackerSideBar,
  UserBlock
} from '@/components/index'
import DetailsModal from '@/components/Tracker/DetailsModal'
import { fetchDocuments } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  PrinterIcon,
  StarIcon
} from '@heroicons/react/20/solid'
import { format } from 'date-fns'
import React, { Fragment, useEffect, useState } from 'react'
import AddDocumentModal from './AddDocumentModal'
import Filters from './Filters'

// Types
import type {
  DocumentTypes,
  PdsPersonalInfomationTypes,
  ServiceRecordTypes
} from '@/types'

// Redux imports
import LoadingSkeleton from '@/components/Loading/LoadingSkeleton'
import { PrintLeaveForm } from '@/components/Printables/PrintLeaveForm'
import { PrintLocatorSlipForm } from '@/components/Printables/PrintLocatorSlipForm'
import { PrintPassSlipForm } from '@/components/Printables/PrintPassSlipForm'
import { PrintServiceRecord } from '@/components/Printables/PrintServiceRecord'
import { PrintTravelForm } from '@/components/Printables/PrintTravelForm'
import { PrintUndertimeForm } from '@/components/Printables/PrintUndertimeForm'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useReactToPrint } from 'react-to-print'
import Search from './Search'
import StickiesModal from './StickiesModal'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStickiesModal, setShowStickiesModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)

  // Filters
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterOffice, setFilterOffice] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [filterRequester, setFilterRequester] = useState('')

  const [list, setList] = useState<DocumentTypes[]>([])
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [showingCount, setShowingCount] = useState<number>(0)
  const [resultsCount, setResultsCount] = useState<number>(0)

  const searchParams = useSearchParams()
  const filterUrl = searchParams.get('filter')
  const isSearchView = filterUrl && filterUrl === 'search'

  const { session, supabase } = useSupabase()

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
      const filterUrl = searchParams.get('filter')

      const result = await fetchDocuments(
        {
          filterKeyword,
          filterDate,
          filterType,
          filterStatus,
          filterSchool,
          filterOffice,
          filterRequester
        },
        filterUrl,
        session.user.id,
        perPageCount,
        0
      )

      // update the list in redux
      dispatch(updateList(result.data))

      setResultsCount(result.count ? result.count : 0)
      setShowingCount(result.data.length)
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
      const result = await fetchDocuments(
        {
          filterKeyword,
          filterType,
          filterStatus,
          filterSchool,
          filterOffice,
          filterRequester
        },
        filterUrl,
        session.user.id,
        perPageCount,
        list.length
      )

      // update the list in redux
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))

      setResultsCount(result.count ? result.count : 0)
      setShowingCount(newList.length)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setShowAddModal(true)
  }
  const handlePrint = async (item: DocumentTypes) => {
    setSelectedItem(null) // Temporarily set selectedItem to null to unmount the content

    let pdsData: PdsPersonalInfomationTypes | null = null
    let serviceRecordsData: ServiceRecordTypes[] | [] = []

    if (item.type === 'Service Record Print Request') {
      // place of birthday data
      const { data: pds } = await supabase
        .from('hrm_pds')
        .select('place_of_birth')
        .eq('user_id', item.created_by)
        .maybeSingle()

      // Service
      const { data: sr } = await supabase
        .from('hrm_service_records')
        .select()
        .eq('user_id', item.created_by)

      pdsData = pds
      serviceRecordsData = sr
    }

    setTimeout(() => {
      setSelectedItem({
        ...item,
        print_place_of_birth: pdsData ? pdsData.place_of_birth : '',
        print_service_records: serviceRecordsData
      }) // Set the new item after a short delay
      setTimeout(() => {
        printFn() // Trigger the print function after re-rendering the new content
      }, 100) // Adjust this delay if needed
    }, 100) // This delay ensures the unmounting and re-rendering are separated
  }

  const handleShowDetailsModal = (item: DocumentTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setList(globallist)
  }, [globallist])

  useEffect(() => {
    void fetchData()
  }, [refresh])

  // Reset filters when URL changes (e.g., tab switched)
  useEffect(() => {
    console.log('Filter URL changed:', filterUrl)
    setFilterKeyword('')
    setFilterType('')
    setFilterDate('')
    setFilterStatus('')
    setFilterRequester('')
    setRefresh((prev) => !prev) // 👈 ensure data is re-fetched
  }, [filterUrl])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list
  return (
    <>
      <Sidebar>
        <TrackerSideBar />
      </Sidebar>
      <div className="app__main">
        <div>
          {/* Header */}
          <TopBar />
          <div className="app__title">
            <Title
              title={isSearchView ? 'Search Request' : 'Request Tracker'}
            />

            <CustomButton
              containerStyles="app__btn_yellow flex items-center space-x-2"
              title="Stickies"
              btnType="button"
              handleClick={() => setShowStickiesModal(true)}
              rightIcon={
                <StarIcon className="cursor-pointer w-4 h-4 text-yellow-100" />
              }
            />
            <CustomButton
              containerStyles="app__btn_green"
              title="Create New Request"
              btnType="button"
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          {isSearchView ? (
            <div className="app__filters">
              <Search
                filterKeyword={filterKeyword}
                filterRequester={filterRequester}
                filterDate={filterDate}
                filterType={filterType}
                filterStatus={filterStatus}
                filterSchool={filterSchool}
                filterOffice={filterOffice}
                setFilterKeyword={setFilterKeyword}
                setFilterRequester={setFilterRequester}
                setFilterDate={setFilterDate}
                setFilterType={setFilterType}
                setFilterStatus={setFilterStatus}
                setFilterSchool={setFilterSchool}
                setFilterOffice={setFilterOffice}
                setRefresh={() => setRefresh((prev) => !prev)} // ✅ toggle
              />
            </div>
          ) : (
            <div className="app__filters">
              <Filters
                filterType={filterType}
                filterStatus={filterStatus}
                setFilterType={setFilterType}
                setFilterStatus={setFilterStatus}
                setRefresh={() => setRefresh((prev) => !prev)} // ✅ toggle
              />
            </div>
          )}

          {/* Per Page */}
          {!loading && !isDataEmpty && (
            <PerPage
              showingCount={showingCount}
              resultsCount={resultsCount}
              perPageCount={perPageCount}
              setPerPageCount={setPerPageCount}
            />
          )}

          {loading && <LoadingSkeleton />}

          {/* Main Content */}
          <div>
            {!loading && !isDataEmpty && (
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th pl-4"></th>
                    <th className="app__th w-16"></th>
                    <th className="app__th">Reference Code</th>
                    <th className="app__th">Request Type</th>
                    <th className="hidden sm:table-cell app__th">Details</th>
                    <th className="hidden sm:table-cell app__th">Requester</th>
                    <th className="hidden sm:table-cell app__th">
                      Current Status
                    </th>
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
                          <div className="font-medium">
                            {item.reference_code}
                          </div>
                        </td>
                        <td className="app__td">
                          <div className="font-medium">{item.type}</div>
                        </td>
                        <td className="hidden sm:table-cell app__td">
                          {item.particulars &&
                            item.particulars.trim() !== '' && (
                              <div>
                                <span className="font-light">Particulars:</span>{' '}
                                <span className="font-medium">
                                  {item.particulars}
                                </span>
                              </div>
                            )}
                          <div>
                            <div className="font-light">Date Requested:</div>{' '}
                            <div className="font-medium">
                              {format(
                                new Date(item.created_at),
                                'MMM dd, yyyy h:mm a'
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell app__td">
                          <UserBlock user={item.creator} />
                        </td>
                        <td className="hidden sm:table-cell app__td">
                          <div>
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
                          </div>
                          <div className="mt-1">
                            <span>
                              Forwarded to {item.receiver.firstname}{' '}
                              {item.receiver.middlename}{' '}
                              {item.receiver.lastname}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {loading && <TableRowLoading cols={7} rows={2} />}
                </tbody>
              </table>
            )}
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
            {/* Show More */}
            {resultsCount > showingCount && !loading && (
              <ShowMore handleShowMore={handleShowMore} />
            )}

            {/* Add Document Modal */}
            {showAddModal && (
              <AddDocumentModal hideModal={() => setShowAddModal(false)} />
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedItem && (
              <DetailsModal
                documentData={selectedItem}
                refresh={() => setRefresh(!refresh)}
                hideModal={() => setShowDetailsModal(false)}
              />
            )}
            {/* Stickies Modal */}
            {showStickiesModal && (
              <StickiesModal hideModal={() => setShowStickiesModal(false)} />
            )}
            {/* Print Leave */}
            {selectedItem && selectedItem.type === 'Leave' && (
              <PrintLeaveForm selectedItem={selectedItem} ref={componentRef} />
            )}
            {/* Print Locator Slip */}
            {selectedItem && selectedItem.type === 'Locator Slip' && (
              <PrintLocatorSlipForm
                selectedItem={selectedItem}
                ref={componentRef}
              />
            )}
            {/* Print Pass Slip */}
            {selectedItem && selectedItem.type === 'Pass Slip' && (
              <PrintPassSlipForm
                selectedItem={selectedItem}
                ref={componentRef}
              />
            )}
            {/* Print Undertime Permit */}
            {selectedItem && selectedItem.type === 'Undertime Permit' && (
              <PrintUndertimeForm
                selectedItem={selectedItem}
                ref={componentRef}
              />
            )}
            {/* Print Travel Form */}
            {selectedItem && selectedItem.type === 'Travel Authority' && (
              <PrintTravelForm selectedItem={selectedItem} ref={componentRef} />
            )}

            {/* Print Service Record */}
            {selectedItem &&
              selectedItem.type === 'Service Record Print Request' && (
                <PrintServiceRecord
                  selectedItem={selectedItem}
                  ref={componentRef}
                />
              )}
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
