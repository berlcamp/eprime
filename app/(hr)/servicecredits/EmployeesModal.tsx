/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton, ConfirmModal, TableRowLoading } from '@/components'
import uuid from 'react-uuid'
import { ArrowPathIcon, ChevronDownIcon, TrashIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { searchActiveEmployees } from '@/utils/fetchApi'
import AttachmentsModal from './AttachmentsModal'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

// Types
import type { ServiceCreditTypes, ServiceCreditUserTypes, excludedItemsTypes, namesType } from '@/types'

interface ModalProps {
  hideModal: () => void
  scData: ServiceCreditTypes | null
}

const EmployeesModal = ({ hideModal, scData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedRow, setSelectedRow] = useState<ServiceCreditUserTypes | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | ''>('')

  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])

  const [list, setList] = useState<ServiceCreditUserTypes[]>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const handleAddEmployee = async () => {
    if (!scData) return

    if (selectedItems.length === 0) {
      setErrorMessage('Employee name is required')
      return
    }

    // if for some reason the employee selected already exists
    if (list.some((item) => selectedItems[0].id === item.hrm_user_id)) {
      return
    }

    const refCode = scData.reference_code

    const newData = {
      service_credit_id: scData.id,
      hrm_user_id: selectedItems[0].id,
      reference_code: refCode,
      is_approved: false,
      service_credits: Number(scData.service_credits)
    }

    try {
      const { error, data } = await supabase
        .from('hrm_service_credit_users')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      setSelectedItems([])

      const updatedData = { ...newData, hrm_users: selectedItems[0], id: data[0].id }

      // add to list
      setList([updatedData, ...list])

      // Update data in redux
      const items = globallist.map((item: ServiceCreditTypes) => {
        if (item.id === scData?.id) {
          return { ...item, hrm_service_credit_users: [updatedData, ...list] }
        } else {
          return item
        }
      })
      dispatch(updateList(items))

      // insert to notifications
      const { error2 } = await supabase
        .from('hrm_notifications')
        .insert({
          message: 'You are added to a <b>Service Credit</b>, please upload supporting documents.',
          url: `/myservicecredits/${refCode}`,
          type: 'service_credit',
          user_id: selectedItems[0].id,
          reference_id: data[0].id,
          reference_table: 'hrm_service_credit_users'
        })

      if (error2) {
        throw new Error(error2.message)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = (item: ServiceCreditUserTypes) => {
    setSelectedRow(item)
    setShowApproveModal(true)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const handleViewAttachments = (id: string) => {
    setSelectedId(id)
    setShowAttachmentsModal(true)
  }

  const handleApproveConfirmed = async () => {
    if (!scData) return

    try {
      const refCode = scData.reference_code

      const { error } = await supabase
        .from('hrm_service_credit_users')
        .update({ is_approved: true })
        .eq('id', selectedRow?.id)

      if (error) throw new Error(error.message)

      // insert to notifications
      const { error2 } = await supabase
        .from('hrm_notifications')
        .insert({
          message: 'Your <b>Service Credit</b> has been approved.',
          url: `/myservicecredits/${refCode}`,
          type: 'service_credits',
          user_id: selectedRow?.hrm_user_id,
          reference_id: selectedRow?.id,
          reference_table: 'hrm_service_credit_users'
        })

      if (error2) throw new Error(error2.message)

      // Update list
      const updatedData = list.map(item => {
        if (item.id === selectedRow?.id) {
          return { ...item, is_approved: true }
        }
        return item
      })
      setList(updatedData)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')
    } catch (e) {
      console.error(e)
    }

    setShowApproveModal(false)
  }

  const handleDeleteConfirmed = async () => {
    try {
      const { error } = await supabase
        .from('hrm_service_credit_users')
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      // delete to notifications
      const { error2 } = await supabase
        .from('hrm_notifications')
        .delete()
        .eq('reference_table', 'hrm_service_credit_users')
        .eq('reference_id', selectedId)

      if (error2) throw new Error(error2.message)

      // Update list
      const updatedData = list.filter(item => item.id !== selectedId)
      setList(updatedData)

      // Update hrm_service_credit_users data in redux
      const items = globallist.map((item: ServiceCreditTypes) => {
        if (item.id === scData?.id) {
          return { ...item, hrm_service_credit_users: updatedData }
        } else {
          return item
        }
      })
      dispatch(updateList(items))

      // delete the files on supabase storage
      const { data: files, error: error3 } = await supabase.storage.from('hrm').list(`servicecredits/${selectedId}`)
      if (error3) throw new Error(error3.message)
      if (files.length > 0) {
        const filesToRemove = files.map((x: { name: string }) => `servicecredits/${selectedId}/${x.name}`)
        const { error: error4 } = await supabase.storage.from('hrm').remove(filesToRemove)
        if (error4) throw new Error(error4.message)
      }

      // pop up the success message
      setToast('success', 'Successfully Deleted!')
    } catch (e) {
      console.error(e)
    }

    setShowDeleteModal(false)
  }

  const handleSearchUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value
    setSearchHead(searchTerm)
    setErrorMessage('')

    if (searchTerm.trim().length < 3) {
      setSearchResults([])
      return
    }

    const excludedItems: excludedItemsTypes[] = []
    list.forEach((item: ServiceCreditUserTypes) => {
      excludedItems.push({ id: item.hrm_user_id })
    })
    excludedItems.push(...selectedItems)

    const results = await searchActiveEmployees(searchTerm, excludedItems)

    setSearchResults(results)
  }

  const handleSelected = (item: namesType, multiple = false) => {
    if (multiple) {
      setSelectedItems([...selectedItems, item])
    } else {
      setSelectedItems([item])
    }

    setSearchResults([])
    setSearchHead('')
  }
  const handleRemoveSelected = (id: string) => {
    setSelectedItems(prevSelectedItems => prevSelectedItems.filter(item => item.id !== id))
  }

  const fetchData = async () => {
    setLoading(true)
    setList([])

    try {
      const { data, error } = await supabase
        .from('hrm_service_credit_users')
        .select('*, hrm_users:hrm_user_id(lastname,firstname,middlename)')
        .eq('service_credit_id', scData?.id)
        .order('id', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setList(data)
    } catch (error) {
      console.error('fetch sc users', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void fetchData()
  }, [])

  if (!scData) {
    return
  }

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Manage Service Credit Employees
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>
          <div className="app__modal_header">
            <div className='w-full'>
              <div className='app__form_field_container'>
                <div className='w-full'>
                  <div className='app__label_standard'>Add Employee:</div>
                  <div className='app__selected_users_container'>
                    {
                      selectedItems.length > 0 &&
                        selectedItems.map(item => (
                          <div key={uuid()} className='w-full flex mb-1'>
                            <span className='app__selected_user'>
                              {item.firstname} {item.middlename} {item.lastname}
                              <XMarkIcon onClick={() => handleRemoveSelected(item.id)} className='w-4 h-4 ml-2 cursor-pointer'/>
                            </span>
                          </div>
                        ))
                    }
                    {
                      selectedItems.length === 0 &&
                        <div className='relative'>
                          <input
                            type="text"
                            placeholder='Search employee..'
                            value={searchHead}
                            onChange={async (e) => await handleSearchUser(e)}
                            className='app__input_noborder'/>

                            {
                              searchResults.length > 0 &&
                                <div className='app__search_user_results_container'>
                                  {
                                    searchResults.map((item: namesType) => (
                                      <div
                                        key={uuid()}
                                        onClick={() => handleSelected(item)}
                                        className='app__search_user_results'>
                                          {item.firstname} {item.middlename} {item.lastname}
                                      </div>
                                    ))
                                  }
                                </div>
                            }
                        </div>
                    }
                  </div>
                  {errorMessage && <div className='app__error_message'>{errorMessage}</div>}
                </div>
              </div>
              <div className="app__modal_footer_left">
                    <CustomButton
                      btnType='button'
                      handleClick={handleAddEmployee}
                      isDisabled={saving}
                      title={saving ? 'Saving...' : 'Add'}
                      containerStyles="app__btn_green"
                    />
              </div>
            </div>
          </div>
          <div className="app__modal_body">
            {/* Main Content */}
            <div className='pb-5'>
              <div className='app__warning_text2'><span className='app__warning_title'>Note:</span> Approved employees can no longer be deleted.</div>
              <div className='flex justify-end'>
                <CustomButton
                  btnType='button'
                  handleClick={fetchData}
                  isDisabled={loading}
                  title='Refresh'
                  containerStyles="app__btn_normal mb-2 flex space-x-1"
                  rightIcon={<ArrowPathIcon className='w-4 h-4'/>}
                />
              </div>
              <table className="app__table">
                <thead className="app__thead">
                    <tr>
                        <th className="hidden md:table-cell app__th pl-4"></th>
                        <th className="hidden md:table-cell app__th">
                            Employees
                        </th>
                        <th className="hidden md:table-cell app__th">
                            Status
                        </th>
                        <th className="hidden md:table-cell app__th">
                            Attachments
                        </th>
                        <th className="hidden md:table-cell app__th">

                        </th>
                    </tr>
                </thead>
                <tbody>
                  {
                    !isDataEmpty && list.map((item: ServiceCreditUserTypes) => (
                      <tr
                        key={uuid()}
                        className="app__tr">
                        <td
                          className="w-6 pl-4 app__td">
                          {
                            !item.is_approved &&
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
                                            onClick={ () => handleDelete(item.id) }
                                            className='app__dropdown_item'>
                                            <TrashIcon className='w-4 h-4'/>
                                            <span>Remove</span>
                                          </div>
                                      </Menu.Item>
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </Menu>
                          }
                        </td>
                        <th
                          className="app__th_firstcol">
                          <div>{item.hrm_users?.firstname} {item.hrm_users?.middlename} {item.hrm_users?.lastname}</div>
                          {/* Mobile View */}
                          <div>
                            <div className="md:hidden app__td">
                              <div className='font-light'>{item.hrm_users?.firstname} {item.hrm_users?.middlename} {item.hrm_users?.lastname}</div>
                            </div>
                          </div>
                          {/* End - Mobile View */}

                        </th>
                        <td
                          className="hidden md:table-cell app__td">
                          {
                            item.is_approved
                              ? <span className='app__status_container_green'>Approved</span>
                              : <span className='app__status_container_orange'>Pending Approval</span>
                          }
                        </td>
                        <td
                          className="hidden md:table-cell app__td">
                          <div>
                            <CustomButton
                              btnType='button'
                              title='View Attachments'
                              handleClick={() => handleViewAttachments(item.id)}
                              containerStyles="app__btn_normal"
                            />
                          </div>
                        </td>
                        <td
                          className="hidden md:table-cell app__td">
                            {
                              !item.is_approved &&
                                <CustomButton
                                  btnType='button'
                                  title='Approve'
                                  handleClick={() => handleApprove(item)}
                                  containerStyles="app__btn_green"
                                />
                            }
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
          </div>
        </div>
      </div>
    </div>
    {/* Delete Modal */}
    {
      showDeleteModal && (
        <ConfirmModal
          header='Confirm Delete'
          btnText='Confirm'
          message="This action cannot be undone. Are you sure you want to remove this employee?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )
    }
    {/* Confirm Approve Modal */}
    {
      showApproveModal && (
        <ConfirmModal
          header='Confirm Approve'
          btnText='Confirm'
          message="This action cannot be undone. Are you sure you want to approve this employee?"
          onConfirm={handleApproveConfirmed}
          onCancel={() => setShowApproveModal(false)}
        />
      )
    }
    {/* Attachments Modal */}
    {
      showAttachmentsModal && (
        <AttachmentsModal
          id={selectedId}
          hideModal={() => setShowAttachmentsModal(false)}/>
      )
    }
  </>
  )
}

export default EmployeesModal
