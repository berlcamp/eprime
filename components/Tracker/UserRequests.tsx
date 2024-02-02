'use client'

import React, { useEffect, useState } from 'react'
import { PerPage, TableRowLoading, CustomButton, ShowMore, UserBlock, Title } from '@/components'
import DetailsModal from '@/components/Tracker/DetailsModal'
import { format } from 'date-fns'

// Types
import type { DocumentTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useSupabase } from '@/context/SupabaseProvider'
import { TagIcon } from '@heroicons/react/20/solid'
import { requestTypes } from '@/constants'
import AddDocumentModal from '@/app/(hr)/tracker/AddDocumentModal'

export default function UserRequests ({ userId }: { userId: string }) {
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

  const [showAddModal, setShowAddModal] = useState(false)

  const { supabase, session } = useSupabase()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('hrm_request_trackers')
        .select('*,creator:created_by(id,firstname,lastname,middlename,avatar_url,position_type),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url),hrm_remarks(*)', { count: 'exact' })
        .eq('created_by', userId)

      if (!clear) {
        // Filter type
        if (filterType !== '') {
          query = query.eq('type', filterType)
        }

        if (filterStatus !== '') {
          query = query.eq('current_status', filterStatus)
        }
      }

      // Per Page from context
      const from = 0
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
        .select('*,creator:created_by(id,firstname,lastname,middlename,avatar_url,position_type),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url),hrm_remarks(*)', { count: 'exact' })
        .eq('created_by', userId)

      // Filter type
      if (filterType !== '') {
        query = query.eq('type', filterType)
      }

      if (filterStatus !== '') {
        query = query.eq('current_status', filterStatus)
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
  }, [])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list
  return (
    <div className='mt-4 mx-2'>
        <div className='app__title'>
          <Title title='Requests'/>
          {
            userId === session.user.id &&
              <CustomButton
                containerStyles='app__btn_green'
                title='Create New Request'
                btnType='button'
                handleClick={() => setShowAddModal(true)}
              />
          }
        </div>

        <div className='app__warning_text'>You can create your request here such as Leave Request, Travel Authority, Pass Slips, Undertime Permit, Locator Slip, and Service Record Print Request.</div>

        {/* Filters */}
        <div className='app__filters'>
          <div className=''>
            <div className='items-center space-y-2 space-x-1'>
              <form onSubmit={fetchData} className='inline-flex items-center app__filter_field_container'>
                <div className='items-center space-y-1'>
                  <div className='app__filter_container'>
                    <TagIcon className="w-4 h-4 mr-1"/>
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className='app__filter_select'>
                        <option value=''>Type:</option>
                        {
                          requestTypes.map((type, index) => <option key={index} value={type}>{type}</option>)
                        }
                    </select>
                  </div>
                  <div className='app__filter_container'>
                    <TagIcon className="w-4 h-4 mr-1"/>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className='app__filter_select'>
                        <option value=''>Status:</option>
                        <option value='Approved'>Approved</option>
                        <option value='Approval Recommended'>Approval Recommended</option>
                        <option value='For Verification'>For Verification</option>
                        <option value='Disapproved'>Disapproved</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className='flex items-center space-x-2 mt-4'>
              <CustomButton
                    containerStyles='app__btn_green'
                    title='Apply Filter'
                    btnType='button'
                    handleClick={fetchData}
                  />
              <CustomButton
                  containerStyles='app__btn_gray'
                  title='Clear Filter'
                  btnType='button'
                  handleClick={handleClear}
                />
            </div>
          </div>
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
        {/* Details Modal */}
        {
          (showDetailsModal && selectedItem) && (
            <DetailsModal
              documentData={selectedItem}
              hideModal={() => setShowDetailsModal(false)}/>
          )
        }
        {/* Add Document Modal */}
        {
            showAddModal && (
              <AddDocumentModal
                hideModal={() => setShowAddModal(false)}/>
            )
          }
    </div>
  )
}
