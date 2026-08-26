'use client'
import {
  CustomButton,
  DeleteModal,
  PerPage,
  SettingsSideBar,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  Unauthorized
} from '@/components/index'
import TopBar from '@/components/TopBar'
import { superAdmins } from '@/constants'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { HolidayTypes } from '@/types'
import { fetchHolidays } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { TrashIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AddEditModal from './AddEditModal'

const currentYear = new Date().getFullYear()

// Five years back, two ahead: enough to file late leave and to encode next
// year's proclamation before December.
const years = Array.from({ length: 8 }, (_, i) => String(currentYear + 2 - i))

const Page: React.FC = () => {
  const { session } = useSupabase()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [list, setList] = useState<HolidayTypes[]>([])
  const [perPageCount, setPerPageCount] = useState<number>(50)
  const [editData, setEditData] = useState<HolidayTypes | null>(null)
  const [year, setYear] = useState<string>(String(currentYear))

  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await fetchHolidays(perPageCount, 0, year)
      dispatch(updateList(result.data))
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

  const handleShowMore = async () => {
    setLoading(true)
    try {
      const result = await fetchHolidays(perPageCount, list.length, year)
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))
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

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
  }

  const handleEdit = (item: HolidayTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMMM d, yyyy (EEEE)')
    } catch {
      return date
    }
  }

  useEffect(() => {
    setList(globallist)
  }, [globallist])

  useEffect(() => {
    setList([])
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPageCount, year])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  if (!superAdmins.includes(session?.user.email ?? '')) return <Unauthorized />

  return (
    <>
      <Sidebar>
        <SettingsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Holidays" />
            <CustomButton
              containerStyles="app__btn_green"
              title="Add Holiday"
              btnType="button"
              handleClick={handleAdd}
            />
          </div>

          <div className="mx-4 mt-4">
            <div className="app__label_standard">Year</div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="app__select_standard"
            >
              <option value="All">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Holidays listed here are not counted as leave days, except for
              leaves counted in calendar days (Maternity, Adoption, Special
              Leave Benefits For Women, Rehabilitation, Study).
            </p>
          </div>

          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th pl-4"></th>
                  <th className="app__th">Date</th>
                  <th className="app__th">Holiday</th>
                  <th className="app__th">Type</th>
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
                      <th className="app__th_firstcol">
                        {formatDate(item.date)}
                      </th>
                      <td className="app__td">{item.name}</td>
                      <td className="app__td">
                        {item.type === 'Regular Holiday' ? (
                          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                            {item.type}
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded">
                            {item.type}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={4} rows={2} />}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}

          {showDeleteModal && (
            <DeleteModal
              id={selectedId}
              table="hrm_holidays"
              hideModal={() => setShowDeleteModal(false)}
            />
          )}

          {showAddModal && (
            <AddEditModal
              editData={editData}
              hideModal={() => setShowAddModal(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}
export default Page
