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
} from '@/components/index'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchCtos } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/20/solid'
import { isCtoExpired } from '@/lib/utils'
import { format } from 'date-fns'
import React, { Fragment, useEffect, useState } from 'react'
import AddEditModal from './AddEditModal'
import EmployeesModal from './EmployeesModal'
import Filters from './Filters'

// Types
import type { CtoTypes, CtoUserTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEmployeesModal, setShowEmployeesModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedId, setSelectedId] = useState<string>('')
  const [list, setList] = useState<CtoTypes[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [editData, setEditData] = useState<CtoTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session, supabase } = useSupabase()
  const { hasAccess } = useFilter()

  const [employeesWithHighCoc, setEmployeesWithHighCoc] = useState<
    Array<{ name: string; totalCoc: number }>
  >([])

  const searchParams = useSearchParams()
  const filterUrl = searchParams.get('ref')

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchCtos(
        { filterKeyword, filterStatus },
        filterUrl,
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
      const result = await fetchCtos(
        { filterKeyword, filterStatus },
        null,
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

  const handleEdit = (item: CtoTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleManageEmployees = (item: CtoTypes) => {
    setShowEmployeesModal(true)
    setEditData(item)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const countPending = (users: CtoUserTypes[] | null) => {
    if (!users) return 0

    const filtered = users.filter((user) => !user.is_approved)
    return filtered.length
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
  }, [filterKeyword, filterUrl, perPageCount, filterStatus])

  // Fetch employees with COC > 15 in current year (only when viewing all CTOs)
  useEffect(() => {
    if (filterUrl) return

    void (async () => {
      try {
        const currentYear = new Date().getFullYear()
        const orgId = process.env.NEXT_PUBLIC_ORG_ID
        const { data, error } = await supabase
          .from('hrm_cto_users')
          .select(
            'coc, hrm_user_id, hrm_ctos:cto_id(date_issued, org_id), hrm_users:hrm_user_id(firstname, middlename, lastname)'
          )

        if (error) throw new Error(error.message)

        const getUserName = (item: {
          hrm_users?:
            | { firstname?: string; middlename?: string; lastname?: string }
            | Array<{ firstname?: string; middlename?: string; lastname?: string }>
        }) => {
          const u = item.hrm_users
          const user = Array.isArray(u) ? u[0] : u
          if (!user) return ''
          const parts = [
            user.firstname,
            user.middlename,
            user.lastname
          ].filter(Boolean)
          return parts.join(' ').trim()
        }

        const byUser = new Map<
          string,
          { name: string; totalCoc: number }
        >()

        for (const item of data ?? []) {
          const ctos = item.hrm_ctos as
            | { date_issued?: string; org_id?: string }
            | Array<{ date_issued?: string; org_id?: string }>
            | null
          const cto = Array.isArray(ctos) ? ctos[0] : ctos
          if (!cto?.date_issued || cto.org_id !== orgId) continue
          if (new Date(cto.date_issued).getFullYear() !== currentYear) continue

          const userId = item.hrm_user_id
          const coc = Number(item.coc) || 0
          const name = getUserName(item as Parameters<typeof getUserName>[0])

          const existing = byUser.get(userId)
          if (existing) {
            existing.totalCoc += coc
          } else {
            byUser.set(userId, { name, totalCoc: coc })
          }
        }

        const highCoc = Array.from(byUser.values())
          .filter((e) => e.totalCoc > 15)
          .sort((a, b) => b.totalCoc - a.totalCoc)

        setEmployeesWithHighCoc(highCoc)
      } catch (e) {
        console.error('fetch employees with COC > 15', e)
        setEmployeesWithHighCoc([])
      }
    })()
  }, [filterUrl, supabase])

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
          {filterUrl && (
            <div className="app__title">
              <Link href="/ctos" className="flex items-center app__btn_gray">
                <ArrowLeftIcon className="w-5 h-5" />
                View All CTOs
              </Link>
            </div>
          )}
          {!filterUrl && (
            <>
              <div className="app__title">
                <Title title="Compensatory Time Off" />
                <CustomButton
                  containerStyles="app__btn_green"
                  title="Create New CTO"
                  btnType="button"
                  handleClick={handleAdd}
                />
              </div>

              {/* Filters */}
              <div className="app__filters">
                <Filters
                  setFilterKeyword={setFilterKeyword}
                  setFilterStatus={setFilterStatus}
                />
              </div>

              <div className="app__warning_text">
                <span className="app__warning_title">Note:</span> CTO with
                employee/s cannot be deleted.
              </div>

              {employeesWithHighCoc.length > 0 && (
                <div className="app__warning_text">
                  <span className="app__warning_title">
                    Employees with COC &gt; 15 (current year):
                  </span>{' '}
                  {employeesWithHighCoc.map((e) => `${e.name} (${e.totalCoc})`).join(', ')}
                </div>
              )}

              {/* Per Page */}
              <PerPage
                showingCount={resultsCounter.showing}
                resultsCount={resultsCounter.results}
                perPageCount={perPageCount}
                setPerPageCount={setPerPageCount}
              />
            </>
          )}

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="hidden md:table-cell app__th pl-4"></th>
                  <th className="hidden md:table-cell app__th">
                    Reference Code
                  </th>
                  <th className="hidden md:table-cell app__th">SO #</th>
                  <th className="hidden md:table-cell app__th">COC</th>
                  <th className="hidden md:table-cell app__th">Employees</th>
                  <th className="hidden md:table-cell app__th">Particulars</th>
                  <th className="hidden md:table-cell app__th">Duration</th>
                  <th className="hidden md:table-cell app__th">Status</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: CtoTypes, index) => (
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
                                  <>
                                    <Menu.Item>
                                      {item.hrm_cto_users?.length === 0 ||
                                      hasAccess('settings') ? (
                                        <div
                                          onClick={() => handleEdit(item)}
                                          className="app__dropdown_item"
                                        >
                                          <PencilSquareIcon className="w-4 h-4" />
                                          <span>Edit</span>
                                        </div>
                                      ) : (
                                        <div className="app__dropdown_item_disabled">
                                          <PencilSquareIcon className="w-4 h-4" />
                                          <span>Edit</span>
                                        </div>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleManageEmployees(item)
                                        }
                                        className="app__dropdown_item"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                        <span>Manage Employees</span>
                                      </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      {item.hrm_cto_users?.length === 0 ? (
                                        <div
                                          onClick={() => handleDelete(item.id)}
                                          className="app__dropdown_item"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                          <span>Delete</span>
                                        </div>
                                      ) : (
                                        <div className="app__dropdown_item_disabled">
                                          <TrashIcon className="w-4 h-4" />
                                          <span>Delete</span>
                                        </div>
                                      )}
                                    </Menu.Item>
                                  </>
                                )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <div>{item.reference_code}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <div className="font-light">
                              Particulars: {item.particulars}
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        <div className="font-semibold">{item.so_number}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div className="font-semibold">{item.coc}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <CustomButton
                          containerStyles="app__btn_blue"
                          title="Manage Employees"
                          btnType="button"
                          handleClick={() => handleManageEmployees(item)}
                        />
                        {!isCtoExpired(item.expiration) &&
                          countPending(item.hrm_cto_users ?? null) > 0 && (
                            <div className="text-red-500 font-semibold text-[10px]">
                              For Approval(
                              {countPending(item.hrm_cto_users ?? null)})
                            </div>
                          )}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div className="font-semibold">{item.particulars}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>
                          {format(new Date(item.from), 'MMM d, yyyy')} -{' '}
                          {format(new Date(item.to), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {!isCtoExpired(item.expiration) ? (
                          <span className="app__status_green">Active</span>
                        ) : (
                          <span className="app__status_orange">Expired</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={6} rows={2} />}
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

      {/* Employees Modal */}
      {showEmployeesModal && (
        <EmployeesModal
          ctoData={editData}
          hideModal={() => setShowEmployeesModal(false)}
        />
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table="hrm_ctos"
          hideModal={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}
export default Page
