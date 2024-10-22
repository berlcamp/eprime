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
  Unauthorized
} from '@/components'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchRegistrations, logError } from '@/utils/fetchApi'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { Employee } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [list, setList] = useState<Employee[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterOffice, setFilterOffice] = useState<string>('')
  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess, setToast } = useFilter()

  const router = useRouter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchRegistrations(
        { filterKeyword, filterSchool, filterOffice },
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
      const result = await fetchRegistrations(
        { filterKeyword, filterSchool, filterOffice },
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

  const handleApprove = async (item: Employee) => {
    if (approving) return

    setApproving(true)

    // Sign up the user on the server side to fix pkce issue https://github.com/supabase/auth-helpers/issues/569
    axios
      .post('/api/signup', {
        item
      })
      .then(function () {
        // Update data in redux
        const items = [...globallist]
        const updatedList = items.filter((i) => i.id !== item.id)
        dispatch(updateList(updatedList))

        setToast('success', 'An email has been sent to newly approved user.')
        setApproving(false)
      })
      .catch(function (error) {
        void logError(
          'Approving registration',
          'hrm_registrations',
          JSON.stringify(item),
          JSON.stringify(error)
        )
        console.error(error)
      })

    router.refresh()
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
  }, [filterKeyword, perPageCount, filterSchool, filterOffice])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (
    !hasAccess('employee_accounts') &&
    !superAdmins.includes(session.user.email)
  )
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
            <Title title="Registrations" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterKeyword={setFilterKeyword}
              setFilterSchool={setFilterSchool}
              setFilterOffice={setFilterOffice}
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
                    Employee Name
                  </th>
                  <th className="hidden md:table-cell app__th">Status</th>
                  <th className="hidden md:table-cell app__th">
                    School/Office
                  </th>
                  <th className="hidden md:table-cell app__th">Email</th>
                  <th className="hidden md:table-cell app__th"></th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item, index) => (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td"></td>
                      <th className="app__th_firstcol">
                        {item.firstname} {item.middlename} {item.lastname}
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <span className="font-light">
                              Status: {item.status}{' '}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden app__td">
                            <span className="font-light">
                              School or Office: {item.hrm_schools?.name}{' '}
                              {item.hrm_offices?.name}{' '}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden app__td">
                            <span className="font-light">
                              Email: {item.email}{' '}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden app__td">
                            {item.status === 'For Approval' && (
                              <div className="flex items-center justify-start space-x-2">
                                <CustomButton
                                  containerStyles="app__btn_green"
                                  title="Approve"
                                  btnType="button"
                                  handleClick={async () =>
                                    await handleApprove(item)
                                  }
                                />
                                <CustomButton
                                  containerStyles="app__btn_red"
                                  title="Delete"
                                  btnType="button"
                                  handleClick={() => handleDelete(item.id)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.status}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>
                          {item.hrm_schools?.name} {item.hrm_offices?.name}
                        </div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.email}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.status === 'For Approval' && (
                          <div className="flex items-center justify-center space-x-2">
                            <CustomButton
                              containerStyles="app__btn_green"
                              title={approving ? 'Please wait..' : 'Approve'}
                              isDisabled={approving}
                              btnType="button"
                              handleClick={async () =>
                                await handleApprove(item)
                              }
                            />
                            <CustomButton
                              containerStyles="app__btn_red"
                              title="Delete"
                              btnType="button"
                              isDisabled={approving}
                              handleClick={() => handleDelete(item.id)}
                            />
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
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table="hrm_registrations"
          hideModal={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}
export default Page
