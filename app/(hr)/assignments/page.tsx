'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, DeleteModal, TableRowLoading, CustomButton, ShowMore, RecordsSideBar, Title, Unauthorized } from '@/components'
import AddEditModal from './AddEditModal'
import uuid from 'react-uuid'
import Filters from './Filters'
import { useSupabase } from '@/context/SupabaseProvider'
import { useFilter } from '@/context/FilterContext'
import { superAdmins } from '@/constants/TrackerConstants'
import { format } from 'date-fns'
import { fetchSchools, fetchOffices, fetchAssignments } from '@/utils/fetchApi'

// Types
import type { Assignment, SchoolTypes, Office } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [list, setList] = useState<Assignment[]>([])
  const [editData, setEditData] = useState<Assignment | null>(null)
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [showingCount, setShowingCount] = useState<number>(0)
  const [resultsCount, setResultsCount] = useState<number>(0)
  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [offices, setOffices] = useState<Office[] | []>([])

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  // Filters
  const [filterKeyword, setFilterKeyword] = useState<string>('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchAssignments(filterKeyword, perPageCount, 0)

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
      const result = await fetchAssignments(filterKeyword, perPageCount, list.length)

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
    setEditData(null)
  }

  const handleEdit = (item: Assignment) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const getAreaName = (id: string) => {
    const areaSplit = id.split('_')
    if (areaSplit[0] === 'school') {
      const a = schools.filter(school => school.id.toString() === areaSplit[1])
      console.log('a', a)
      // return a[0].name
    }
    if (areaSplit[0] === 'office') {
      const a = offices.filter(office => office.id === areaSplit[1])
      return a[0].name
    }
    return ''
  }

  // Prefetch school and office and send these to modal
  useEffect(() => {
    const fetchAreas = async () => {
      const schools = await fetchSchools({}, 300, 0)
      const offices = await fetchOffices('', 300, 0)

      setSchools(schools.data)
      setOffices(offices.data)
    }

    void fetchAreas()
  }, [])

  // Update list whenever list in redux updates
  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKeyword, perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('records') && !superAdmins.includes(session.user.email)) return <Unauthorized/>

  return (
    <>
    <Sidebar>
      <RecordsSideBar/>
    </Sidebar>
    <div className="app__main">
      <div>
          {/* Header */}
          <TopBar/>
          <div className='app__title'>
            <Title title='Assignments'/>
            <CustomButton
              containerStyles='app__btn_green'
              title='Add New Assignment'
              btnType='button'
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              setFilterKeyword={setFilterKeyword}
            />
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
                      <th className="hidden md:table-cell app__th pl-4"></th>
                      <th className="hidden md:table-cell app__th">
                          Employee Name
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Designation
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Area Assigned
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Duration
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: any) => (
                    <tr
                      key={uuid()}
                      className="app__tr">
                      <td
                        className="w-6 pl-4 app__td">
                        <Menu as="div" className="app__menu_container">
                          <div>
                            <Menu.Button className="app__dropdown_btn">
                              <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
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
                                      onClick={() => handleEdit(item)}
                                      className='app__dropdown_item'
                                    >
                                      <PencilSquareIcon className='w-4 h-4'/>
                                      <span>Edit</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={ () => handleDelete(item.id) }
                                      className='app__dropdown_item'
                                    >
                                      <TrashIcon className='w-4 h-4'/>
                                      <span>Delete</span>
                                    </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th
                        className="app__th_firstcol">
                        {item.hrm_users.firstname} {item.hrm_users.middlename} {item.hrm_users.lastname}
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <div className='app__list_mobile_view'>Designation: {item.designation} </div>
                            <div className='app__list_mobile_view'>Area Assigned: {item.area_assigned} </div>
                            <div className='app__list_mobile_view'>From: {format(new Date(item.from), 'dd MMM yyyy')}</div>
                            <div className='app__list_mobile_view'>To: {format(new Date(item.to), 'dd MMM yyyy')}</div>
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.designation}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{ schools.length > 0 && getAreaName(item.area_assigned)}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{format(new Date(item.from), 'dd MMM yyyy')} - {format(new Date(item.to), 'dd MMM yyyy')}</div>
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={5} rows={2}/> }
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

          {/* Add/Edit Modal */}
          <AddEditModal
            schools={schools}
            offices={offices}
            isOpen={showAddModal}
            editData={editData}
            showingCount={showingCount}
            setShowingCount={setShowingCount}
            resultsCount={resultsCount}
            setResultsCount={setResultsCount}
            closeModal={() => setShowAddModal(false)}/>

          {/* Delete Modal */}
          <DeleteModal
            isOpen={showDeleteModal}
            id={selectedId}
            showingCount={showingCount}
            setShowingCount={setShowingCount}
            resultsCount={resultsCount}
            setResultsCount={setResultsCount}
            table='hrm_schools'
            closeModal={() => setShowDeleteModal(false)}/>

      </div>
    </div>
  </>
  )
}
export default Page
