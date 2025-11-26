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
  Unauthorized,
  UserBlock
} from '@/components/index'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Filters from './Filters'

// Types
import type { NosiTypes, SignatoriesTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { fetchNosi } from '@/utils/fetchApi'
import { formatToPesos } from '@/utils/text-helper'
import { PrinterIcon } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useReactToPrint } from 'react-to-print'
import AddEditModal from './AddEditModal'
import { PrintNosa } from './PrintNosa'
import { PrintNosi } from './PrintNosi'
import SignatoriesModal from './SignatoriesModal'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSignatoriesModal, setShowSignatoriesModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [signatories, setSignatories] = useState<SignatoriesTypes | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<NosiTypes | null>(null)
  const [printType, setPrintType] = useState('nosi')

  const [list, setList] = useState<NosiTypes[]>([])
  const [filterUser, setFilterUser] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [editData, setEditData] = useState<NosiTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const componentRef = React.useRef(null)
  const componentRef2 = React.useRef(null)
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'NOSI'
  })
  const printFn2 = useReactToPrint({
    contentRef: componentRef2,
    documentTitle: 'NOSA'
  })

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchNosi(
        { filterUser, filterDate },
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
      const result = await fetchNosi({ filterUser }, perPageCount, list.length)

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

  const handleDownloadExcel = async () => {
    try {
      // Fetch ALL results (not paginated)
      const result = await fetchNosi(
        { filterUser, filterDate },
        999999, // large limit
        0
      )

      const rows = result.data.map((item: any) => ({
        Employee: item.hrm_user
          ? `${item.hrm_user.lastname}, ${item.hrm_user.firstname} ${
              item.hrm_user.middlename || ''
            }`
          : '',

        'As of Date': item.as_of_date,
        'Previous SG': item.previous_grade,
        'Previous Step': item.previous_step,
        'Previous Salary': Number(item.previous_amount),

        'Effective Date': item.effective_date,
        'New SG': item.new_grade,
        'New Step': item.new_step,
        'New Salary': Number(item.new_amount)
      }))

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(rows)

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'NOSI')

      // Download file
      XLSX.writeFile(workbook, 'NOSI.xlsx')
    } catch (err) {
      console.error('Excel download error:', err)
    }
  }

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
  }

  const handleEdit = (item: NosiTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const handleInitiatePrint = (item: NosiTypes, printType: string) => {
    setSelectedItem(item)
    setPrintType(printType)
    setShowSignatoriesModal(true)
  }

  const handlePrint = (item: NosiTypes, signatories: SignatoriesTypes) => {
    setSelectedItem(null) // Temporarily set selectedItem to null to unmount the content
    setSignatories(null) // Temporarily set selectedItem to null to unmount the content
    setTimeout(() => {
      setSelectedItem(item) // Set the new item after a short delay
      setSignatories(signatories) // Set the new item after a short delay
      setTimeout(() => {
        if (printType === 'nosi') {
          printFn() // Trigger the print function after re-rendering the new content
        } else {
          printFn2() // Trigger the print function after re-rendering the new content
        }
      }, 100) // Adjust this delay if needed
    }, 100) // This delay ensures the unmounting and re-rendering are separated
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
  }, [perPageCount, filterUser, filterDate])

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
          <div className="app__title">
            <Title title="NOSI" />
            <CustomButton
              containerStyles="app__btn_green"
              title="Create New NOSI"
              btnType="button"
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterUser={setFilterUser}
              setFilterDate={setFilterDate}
            />
          </div>

          <div className="flex p-4">
            <CustomButton
              title="Export to Excel"
              containerStyles="app__btn_blue ml-auto"
              btnType="button"
              handleClick={handleDownloadExcel}
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
                  <th className="app__th pl-4"></th>
                  <th className="app__th">Employee Name</th>
                  <th className="app__th">Original Salary</th>
                  <th className="app__th">Adjusted Salary</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: NosiTypes, index) => (
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
                                    onClick={() =>
                                      handleInitiatePrint(item, 'nosi')
                                    }
                                    className="app__dropdown_item"
                                  >
                                    <PrinterIcon className="w-4 h-4" />
                                    <span>Print NOSI</span>
                                  </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                    onClick={() =>
                                      handleInitiatePrint(item, 'nosa')
                                    }
                                    className="app__dropdown_item"
                                  >
                                    <PrinterIcon className="w-4 h-4" />
                                    <span>Print NOSA</span>
                                  </div>
                                </Menu.Item>
                                {new Date(item.effective_date) > new Date() ? (
                                  <>
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
                                  </>
                                ) : null}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        {item.hrm_user && <UserBlock user={item.hrm_user} />}
                      </th>
                      <td className="app__td">
                        <div className="">
                          As of {item.as_of_date}: SG{' '}
                          <span className="font-bold text-sm">
                            {item.previous_grade}
                          </span>
                          , Step{' '}
                          <span className="font-bold text-sm">
                            {item.previous_step}
                          </span>
                          , Salary{' '}
                          <span className="font-bold text-sm">
                            {formatToPesos(Number(item.previous_amount))}
                          </span>
                        </div>
                      </td>
                      <td className="app__td">
                        <div className="">
                          Effective {item.effective_date}: SG{' '}
                          <span className="font-bold text-sm">
                            {item.new_grade}
                          </span>
                          , Step{' '}
                          <span className="font-bold text-sm">
                            {item.new_step}
                          </span>
                          , Salary{' '}
                          <span className="font-bold text-sm">
                            {formatToPesos(Number(item.new_amount))}
                          </span>
                        </div>
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
      {/* Signatories Modal */}
      {selectedItem && showSignatoriesModal && (
        <SignatoriesModal
          hideModal={() => setShowSignatoriesModal(false)}
          modalData={(signatories) => {
            void handlePrint(selectedItem, signatories)
          }}
        />
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table="hrm_nosi"
          hideModal={() => setShowDeleteModal(false)}
        />
      )}
      {/* Print Container */}
      {selectedItem && signatories && (
        <PrintNosi
          selectedItem={selectedItem}
          signatories={signatories}
          ref={componentRef}
        />
      )}
      {/* Print Container */}
      {selectedItem && signatories && (
        <PrintNosa
          selectedItem={selectedItem}
          signatories={signatories}
          ref={componentRef2}
        />
      )}
    </>
  )
}
export default Page
