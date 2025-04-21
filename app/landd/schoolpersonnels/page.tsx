'use client'

import {
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  UserBlock
} from '@/components/index'
import { fetchPersonnel } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type {
  AssignmentTypes,
  DesignationTypes,
  Employee,
  Office,
  SchoolTypes
} from '@/types'

import PageNotFound from '@/components/PageNotFound'
import LandDSidebar from '@/components/Sidebars/LandDSidebar'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import PersonnelSubjects from './PersonnelSubjects'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Employee[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const { hasAccess } = useFilter()

  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Employee | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    systemSchools,
    systemOffices,
    session
  }: { systemSchools: SchoolTypes[]; systemOffices: Office[]; session: any } =
    useSupabase()

  let schoolIds: any = []
  let officeIds: any = []

  if (hasAccess('sds') || hasAccess('asds')) {
    schoolIds = systemSchools.map((obj) => obj.id)
    officeIds = systemOffices.map((obj) => obj.id)
  } else {
    const filteredSchools = systemSchools.filter(
      (s) => s.head_user_id === session.user.id
    )

    const filteredOffices = systemOffices.filter(
      (s) => s.head_user_id === session.user.id
    )
    schoolIds = filteredSchools.map((obj) => obj.id)
    officeIds = filteredOffices.map((obj) => obj.id)
  }

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchPersonnel(
        { filterKeyword },
        schoolIds,
        officeIds,
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
      const result = await fetchPersonnel(
        { filterKeyword },
        schoolIds,
        officeIds,
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

  const handleManageSubjects = (item: Employee) => {
    setShowSubjectModal(true)
    setSelectedItem(item)
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
  }, [filterKeyword, perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  if (
    schoolIds.length === 0 &&
    officeIds.length === 0 &&
    session.user.email !== 'berlcamp@gmail.com'
  )
    return <PageNotFound />

  return (
    <>
      <Sidebar>
        <LandDSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Personnel" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterKeyword={setFilterKeyword} />
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
                  <th className="app__th pl-4"></th>
                  <th className="app__th">Employee Name</th>
                  <th className="app__th">Assignment/Designation</th>
                  <th className="app__th">Position</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: Employee, index) => (
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
                                    onClick={() => handleManageSubjects(item)}
                                    className="app__dropdown_item"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Personnel Details</span>
                                  </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <Link href={`/profile/${item.id}`}>
                          <UserBlock user={item} />
                        </Link>
                        <div className="ml-8 font-light">{item.email}</div>
                        <div className="ml-8 font-light">
                          {item.position_type}
                        </div>
                      </th>
                      <td className="app__td space-y-1">
                        <div>
                          <div className="font-semibold">
                            Original Assignment:
                          </div>
                          <div>
                            {item.hrm_schools?.name} {item.hrm_offices?.name}
                          </div>
                        </div>
                        {item.hrm_assignments.length > 0 &&
                          item.hrm_assignments.map(
                            (assignment: AssignmentTypes, index) =>
                              assignment.status === 'Active' &&
                              assignment.type === 'Re-assignment' && (
                                <div key={index}>
                                  <div className="font-semibold text-green-700">
                                    Current Assignment:
                                  </div>
                                  {assignment.area_assigned === 'office' ? (
                                    <span>{assignment.hrm_offices?.name}</span>
                                  ) : (
                                    <span>{assignment.hrm_schools?.name}</span>
                                  )}
                                </div>
                              )
                          )}
                        {item.hrm_designations.length > 0 &&
                          item.hrm_designations.map(
                            (designation: DesignationTypes, index) =>
                              designation.status === 'Active' && (
                                <div key={index}>
                                  <div className="font-semibold text-green-700">
                                    Current Designation:
                                  </div>
                                  {designation.type === 'Function only' ? (
                                    <span>{designation.designation}</span>
                                  ) : designation.area_assigned === 'office' ? (
                                    <span>
                                      {designation.designation} -{' '}
                                      {designation.hrm_offices?.name}
                                    </span>
                                  ) : (
                                    <span>
                                      {designation.designation} -{' '}
                                      {designation.hrm_schools?.name}
                                    </span>
                                  )}
                                </div>
                              )
                          )}
                      </td>
                      <td className="app__td">
                        <div>{item.hrm_positions?.name}</div>
                        {item.salary_grade && item.salary_step && (
                          <div>
                            <span>Salary Grade:</span>{' '}
                            <span className="font-semibold">
                              {item.salary_grade}{' '}
                            </span>
                            <span>Step:</span>{' '}
                            <span className="font-semibold">
                              {item.salary_step}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={5} rows={2} />}
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
        {/* Show committees Modal */}
        {showSubjectModal && selectedItem && (
          <PersonnelSubjects
            employee={selectedItem}
            hideModal={() => setShowSubjectModal(false)}
          />
        )}
      </div>
    </>
  )
}
export default Page
