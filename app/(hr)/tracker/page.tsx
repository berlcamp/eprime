'use client'

import { fetchDocuments } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { StarIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, TableRowLoading, CustomButton, ShowMore, TrackerSideBar, Title, UserBlock } from '@/components'
import AddDocumentModal from './AddDocumentModal'
import DetailsModal from '@/components/Tracker/DetailsModal'
import Filters from './Filters'
import { format } from 'date-fns'

// Types
import type { DocumentTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useSupabase } from '@/context/SupabaseProvider'
import StickiesModal from './StickiesModal'
import { useSearchParams } from 'next/navigation'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStickiesModal, setShowStickiesModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRequester, setFilterRequester] = useState('')
  const [list, setList] = useState<DocumentTypes[]>([])
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [showingCount, setShowingCount] = useState<number>(0)
  const [resultsCount, setResultsCount] = useState<number>(0)

  const searchParams = useSearchParams()

  const { session } = useSupabase()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const filterUrl = searchParams.get('filter')

      const result = await fetchDocuments({ filterKeyword, filterType, filterStatus, filterRequester }, filterUrl, session.user.id, perPageCount, 0)

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
      const filterUrl = searchParams.get('filter')

      const result = await fetchDocuments({ filterKeyword, filterType, filterStatus, filterRequester }, filterUrl, session.user.id, perPageCount, list.length)

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

  const handleShowDetailsModal = (item: DocumentTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setList(globallist)
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKeyword, filterType, filterStatus, perPageCount, filterRequester, searchParams])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list
  return (
    <>
    <Sidebar>
      <TrackerSideBar/>
    </Sidebar>
    <div className="app__main">
      <div>
          {/* Header */}
          <TopBar/>
          <div className='app__title'>
            <Title title='Request Tracker'/>

            <CustomButton
              containerStyles='app__btn_yellow flex items-center space-x-2'
              title='Stickies'
              btnType='button'
              handleClick={() => setShowStickiesModal(true)}
              rightIcon={<StarIcon className='cursor-pointer w-4 h-4 text-yellow-100'/>}
            />
            <CustomButton
              containerStyles='app__btn_green'
              title='Create New Request'
              btnType='button'
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              setFilterKeyword={setFilterKeyword}
              setFilterStatus={setFilterStatus}
              setFilterRequester={setFilterRequester}
              setFilterType={setFilterType}/>
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={showingCount}
            resultsCount={resultsCount}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}/>

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                  <tr>
                        <th className="app__th pl-4"></th>
                        <th className="app__th w-16">
                        </th>
                        <th className="app__th">
                          Reference Code
                        </th>
                        <th className="app__th">
                          Request Type
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Details
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Requester
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Current Status
                        </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: DocumentTypes, index: number) => (
                    <tr key={index} className='app__tr'>
                      <td className='w-6 pl-4 app__td'>
                      </td>
                      <td className='pl-4 app__td'>
                        <div>
                          <button
                            onClick={() => handleShowDetailsModal(item)}
                            className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                            >Request&nbsp;Details</button>
                        </div>
                      </td>
                      <td className='app__td'>
                        <div className='font-medium'>{item.reference_code}</div>
                      </td>
                      <td className='app__td'>
                        <div className='font-medium'>{item.type}</div>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                        {
                          (item.particulars && item.particulars.trim() !== '') &&
                            <div><span className='font-light'>Particulars:</span> <span className='font-medium'>{item.particulars}</span></div>
                        }
                        <div><span className='font-light'>Date Requested:</span> <span className='font-medium'>{format(new Date(item.created_at), 'MMM dd, yyyy h:mm a')}</span></div>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                          <UserBlock user={item.creator}/>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                        {item.current_status === 'Cancelled' && <span className='text-blue-700 px-1 bg-blue-100 border border-blue-500 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'Approval Recommended' && <span className='text-green-700 px-1 bg-green-100 border border-green-500 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'Approved' && <span className='text-green-900 px-1 bg-green-300 border border-green-700 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'Disapproved' && <span className='text-red-700 px-1 bg-red-100 border border-red-500 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'For Verification' && <span className='text-orange-700 px-1 bg-orange-100 border border-orange-500 font-medium'>{item.current_status}</span>}
                        {item.approver && <div className='mt-1'>by {item.approver.firstname} {item.approver.middlename} {item.approver.lastname}</div>}
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={7} rows={2}/> }
              </tbody>
            </table>
            {
              (!loading && isDataEmpty) &&
                <div className='app__norecordsfound'>No records found.</div>
            }
          </div>

          {/* Show More */}
          {
            (resultsCount > showingCount && !loading) &&
              <ShowMore
                handleShowMore={handleShowMore}/>
          }

          {/* Add Document Modal */}
          {
            showAddModal && (
              <AddDocumentModal
                hideModal={() => setShowAddModal(false)}/>
            )
          }

          {/* Details Modal */}
          {
            (showDetailsModal && selectedItem) && (
              <DetailsModal
                documentData={selectedItem}
                hideModal={() => setShowDetailsModal(false)}/>
            )
          }
          {/* Stickies Modal */}
          {
            showStickiesModal && (
              <StickiesModal
                hideModal={() => setShowStickiesModal(false)}/>
            )
          }
      </div>
    </div>
  </>
  )
}
export default Page
