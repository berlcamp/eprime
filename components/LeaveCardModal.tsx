'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import type { Employee, LeaveCardTypes } from '@/types'
import { useEffect, useRef, useState } from 'react'
import CustomButton from './CustomButton'
import TableRowLoading from './Loading/TableRowLoading'
import { fetchLeaveCards, logError } from '@/utils/fetchApi'
import ShowMore from './ShowMore'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'

interface ModalProps {
  hideModal: () => void
  userId: string
}

interface AdjustmentTypes {
  type: string
  balance: string
  remarks: string
  confirmed: string
  adjustment_date: string
}

export default function LeaveCardModal ({ hideModal, userId }: ModalProps) {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<LeaveCardTypes[] | []>([])
  const [countResults, setCountResults] = useState(0)
  const [saving, setSaving] = useState(false)

  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)

  const { supabase, systemUsers } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const user: Employee = systemUsers.find((user: Employee) => user.id === userId)

  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    if (loading) return
    setLoading(true)

    try {
      const result = await fetchLeaveCards(userId, 10, 0)

      // update the list
      const newList = [...list, ...result.data]
      setList(newList)
      setCountResults(result.count ? result.count : 0)

      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    if (loading) return
    setLoading(true)

    try {
      const result = await fetchLeaveCards(userId, 10, list.length)

      // update the list
      const newList = [...list, ...result.data]
      setList(newList)
      setCountResults(result.count ? result.count : 0)

      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const { register, formState: { errors }, reset, handleSubmit } = useForm<AdjustmentTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: AdjustmentTypes) => {
    if (saving) return

    setSaving(true)
    try {
      const newData = {
        type: formdata.type,
        balance: formdata.balance,
        remarks: formdata.remarks,
        user_id: userId,
        particulars: `${formdata.type} Adjustment`,
        updated_by: `${user.firstname} ${user.middlename} ${user.lastname}`
      }

      const { error } = await supabase
        .from('hrm_leave_cards')
        .insert(newData)
        .select()

      if (error) {
        void logError('Create Leave Card Manual Adjustment', 'hrm_leave_cards', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // update the list in redux
      const newList = [{
        adjustment_date: format(new Date(formdata.adjustment_date), 'MMM dd, yyyy'),
        particulars: `${formdata.type} Adjustment`,
        credits_used: '',
        credits_earned: '',
        balance: formdata.balance,
        absence_without_pay: '',
        absence_with_pay: '',
        remarks: formdata.remarks,
        type: formdata.type,
        transaction_type: `${formdata.type} Adjustment`,
        id: '',
        from: '',
        to: '',
        user_id: '',
        hrm_user: '',
        created_at: '',
        updated_by: `${user.firstname} ${user.middlename} ${user.lastname}`
      }, ...list]
      setList(newList)
      setCountResults(list.length + 1)

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setShowAdjustmentForm(false)

      // reset all form fields
      reset()

      setSaving(false)
    } catch (error) {
      console.error('error', error)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideModal()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [wrapperRef])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  let slBalance
  let vlBalance
  if (!isDataEmpty) {
    const slList = list.filter(item => item.type === 'Sick Leave')
    const vlList = list.filter(item => item.type === 'Vacation Leave')

    slBalance = slList.length > 0 ? slList[0].balance : 0
    vlBalance = vlList.length > 0 ? vlList[0].balance : 0
  }

  return (
      <div ref={wrapperRef} className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text flex-1">{user.firstname} {user.middlename} {user.lastname} Leave Card</h5>
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
                />
            </div>
            <div className="modal-body relative overflow-x-scroll">
              {
                hasAccess('employee_accounts') &&
                  <div className='flex justify-between mt-2 mb-2 px-4'>
                    <div>
                      {
                        !showAdjustmentForm
                          ? <CustomButton
                              containerStyles='app__btn_green'
                              title='Create Adjustment'
                              btnType='button'
                              handleClick={() => setShowAdjustmentForm(true)}
                              />
                          : <form onSubmit={handleSubmit(onSubmit)} className='w-2/3 space-y-4'>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Adjustment Type:</div>
                                <select
                                  {...register('type', { required: true })}
                                  className='app__select_standard'>
                                    <option value=''>Choose Type</option>
                                    <option value='Sick Leave'>Sick Leave Adjustment</option>
                                    <option value='Vacation Leave'>Vacation Leave Adjustment</option>
                                </select>
                                {errors.type && <div className='app__error_message'>Type is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Updated Balance:</div>
                                <input
                                  {...register('balance', { required: true })}
                                  type='number'
                                  placeholder='Updated Balance'
                                  className='app__input_standard'/>
                                {errors.balance && <div className='app__error_message'>Update Balance is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Adjustment Date:</div>
                                <input
                                  {...register('adjustment_date', { required: true })}
                                  type='date'
                                  placeholder='Updated Balance'
                                  className='app__input_standard'/>
                                <div className='text-xs text-gray-600 italic mt-1'>(Next auto increment will be in 1 month from this adjustment date)</div>
                                {errors.adjustment_date && <div className='app__error_message'>Adjustment Date is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Remarks:</div>
                                <input
                                  {...register('remarks', { required: true })}
                                  type='text'
                                  placeholder='Reason for this adjustment'
                                  className='app__input_standard'/>
                                {errors.remarks && <div className='app__error_message'>Reason for this adjustment is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <label className='flex items-center space-x-2'>
                                  <input
                                    {...register('confirmed', { required: true })}
                                    type='checkbox'
                                    className=''/>
                                  <span className='font-normal text-xs text-gray-600'>By checking this box, you acknowledge that all information is accurate and cannot be modified after submission.</span>
                                </label>
                                {errors.confirmed && <div className='app__error_message'>Confirmation is required</div>}
                              </div>
                              <div className='mb-2 w-full space-x-2'>
                                <CustomButton
                                  containerStyles='app__btn_green'
                                  title='Submit'
                                  btnType='submit'
                                  />
                                <CustomButton
                                  containerStyles='app__btn_gray'
                                  title='Cancel'
                                  btnType='button'
                                  handleClick={() => setShowAdjustmentForm(false)}
                                  />
                              </div>
                            </form>
                      }
                    </div>
                  </div>
              }
              <div className='flex justify-end mt-2 mb-2 px-4'>
                <div className='space-x-1'>
                  <span className='border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm'>SL:&nbsp;{slBalance}</span>
                  <span className='border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm'>VL:&nbsp;{vlBalance}</span>
                </div>
              </div>

              {/* Main Content */}
              <div className='mx-4'>
                <table className="app__table">
                  <thead className="app__thead">
                      <tr>
                          <th className="app__th">
                              Adjustment Date
                          </th>
                          <th className="app__th">
                              Particulars
                          </th>
                          <th className="app__th">
                              Credits Used
                          </th>
                          <th className="app__th">
                              Credits Earned
                          </th>
                          <th className="app__th">
                              Balance
                          </th>
                          <th className="app__th">
                              Absence w/out Pay
                          </th>
                          <th className="app__th">
                              Absence w/ Pay
                          </th>
                          <th className="app__th">
                              Remarks
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                    {
                      !isDataEmpty && list.map((item, index) => (
                        <tr
                          key={index}
                          className="app__tr">
                          <td className='app__td'>
                            {format(new Date(item.adjustment_date), 'MMM dd, yyyy')}
                          </td>
                          <td className='app__td'>
                            {item.particulars}
                          </td>
                          <td className='app__td'>
                            {item.credits_used}
                          </td>
                          <td className='app__td'>
                            {item.credits_earned}
                          </td>
                          <td className='app__td'>
                            {item.balance}
                          </td>
                          <td className='app__td'>
                            {item.absence_without_pay}
                          </td>
                          <td className='app__td'>
                            {item.absence_with_pay}
                          </td>
                          <td className='app__td'>
                            <div>{item.remarks}</div>
                            {
                              item.updated_by && <div className='text-[10px] mt-2'>Updated by: <span className='font-semibold'>{item.updated_by}</span></div>
                            }
                          </td>
                        </tr>
                      ))
                    }
                    { loading && <TableRowLoading cols={8} rows={2}/> }
                  </tbody>
                </table>
                {
                  (!loading && isDataEmpty) &&
                    <div className='app__norecordsfound'>No records found.</div>
                }
              </div>

              {/* Show More */}
              {
                list.length < countResults &&
                  <ShowMore
                    handleShowMore={handleShowMore}/>
              }
            </div>
          </div>
        </div>
      </div>
  )
}
