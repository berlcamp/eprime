'use client'

import { leaveCreditTypes } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { Employee, LeaveCardTypes } from '@/types'
import { fetchLeaveCards, logError } from '@/utils/fetchApi'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import CustomButton from '../CustomButton'
import TableRowLoading from '../Loading/TableRowLoading'
import ShowMore from '../ShowMore'
import UserBlock from '../UserBlock'
import LeaveBalanceBoxes from './LeaveBalanceBoxes'

interface PageProps {
  userId: string
  userData: Employee
}

interface AdjustmentTypes {
  type: string
  balance: string
  remarks: string
  confirmed: string
  date_of_next_increment: string
}

export default function LeaveCard({ userId, userData }: PageProps) {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<LeaveCardTypes[] | []>([])
  const [countResults, setCountResults] = useState(0)
  const [saving, setSaving] = useState(false)

  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)

  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const userPositionType =
    userData.position_type === 'Teaching' ? 'Teaching' : 'Non-teaching'

  const fetchData = async () => {
    if (loading) return
    setLoading(true)

    try {
      const result = await fetchLeaveCards(userId, '', 10, 0)

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
      const result = await fetchLeaveCards(userId, '', 10, list.length)

      // update the list
      const newList = [...list, ...result.data]
      setList(newList)
      setCountResults(result.count ? result.count : 0)

      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const {
    register,
    formState: { errors },
    reset,
    watch,
    handleSubmit
  } = useForm<AdjustmentTypes>({
    mode: 'onSubmit'
  })

  const watchedType = watch('type')

  const onSubmit = async (formdata: AdjustmentTypes) => {
    if (saving) return

    setSaving(true)
    try {
      const newData = {
        type: formdata.type,
        balance: formdata.balance,
        remarks: formdata.remarks,
        user_id: userId,
        particulars: `${
          formdata.type
        } Manual Adjustment (Next increment set to ${format(
          new Date(formdata.date_of_next_increment),
          'MMM dd, yyyy'
        )})`,
        updated_by: session.user.id
      }

      const { error } = await supabase
        .from('hrm_leave_cards')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create Leave Card Manual Adjustment',
          'hrm_leave_cards',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update leave credits
      const { error: error2 } = await supabase
        .from('hrm_leave_credits')
        .update({
          credits: formdata.balance,
          date_of_next_increment: formdata.date_of_next_increment
            ? formdata.date_of_next_increment
            : null
        })
        .eq('user_id', userId)
        .eq('type', formdata.type)

      if (error2) {
        void logError(
          'Create Leave Credit Manual Adjustment',
          'hrm_leave_credits',
          '',
          error2.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error2.message)
      }

      // update the list in redux
      const newList = [
        {
          adjustment_date: format(new Date(), 'MMM dd, yyyy'),
          particulars: `${
            formdata.type
          } Manual Adjustment (Next increment set to ${format(
            new Date(formdata.date_of_next_increment),
            'MMM dd, yyyy'
          )})`,
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
          updated_by: ''
        },
        ...list
      ]
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
    // fetch user leave cards
    void fetchData()
  }, [])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <div>
      {hasAccess('employee_accounts') && (
        <div className="flex justify-between mt-2 mb-2 px-4">
          <div className="w-full p-4 bg-gray-100 rounded-sm">
            {!showAdjustmentForm ? (
              <CustomButton
                containerStyles="app__btn_blue"
                title="Create Adjustment"
                btnType="button"
                handleClick={() => setShowAdjustmentForm(true)}
              />
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-2/3 space-y-4"
              >
                <div className="mb-2 w-full">
                  <div className="app__label_standard">Adjustment Type:</div>
                  <select
                    {...register('type', { required: true })}
                    className="app__select_standard"
                  >
                    <option value="">Choose Type</option>
                    {leaveCreditTypes
                      .filter(
                        (l) =>
                          (l.gender.toLowerCase() ===
                            userData.gender.toLowerCase() ||
                            l.gender.toLowerCase() === 'all') &&
                          (l.position_type.toLowerCase() ===
                            userPositionType.toLowerCase() ||
                            l.position_type.toLowerCase() === 'all')
                      )
                      .map((l, i) => (
                        <option key={i} value={`${l.type}`}>
                          {l.type} Adjustment
                        </option>
                      ))}
                  </select>
                  {errors.type && (
                    <div className="app__error_message">Type is required</div>
                  )}
                </div>
                <div className="mb-2 w-full">
                  <div className="app__label_standard">Updated Balance:</div>
                  <input
                    {...register('balance', { required: true })}
                    type="number"
                    step="any"
                    className="app__input_standard"
                  />
                  {errors.balance && (
                    <div className="app__error_message">
                      Update Balance is required
                    </div>
                  )}
                </div>
                {(watchedType === 'Vacation Leave' ||
                  watchedType === 'Sick Leave') && (
                  <div className="mb-2 w-full">
                    <div className="app__label_standard">
                      Date of next Increment:
                    </div>
                    <input
                      {...register('date_of_next_increment', {
                        required: 'Date of next Increment is required',
                        validate: {
                          withinRange: (value) => {
                            const selectedDate = new Date(value) // User input date
                            const currentDate = new Date() // Today's date

                            // Calculate the range
                            const minDate = new Date()
                            minDate.setMonth(currentDate.getMonth() - 5) // 5 months ago

                            const maxDate = new Date()
                            maxDate.setMonth(currentDate.getMonth() + 1) // 1 month from today

                            if (selectedDate < minDate) {
                              return 'Date should not be older than 5 months'
                            }
                            if (selectedDate > maxDate) {
                              return 'Date should not be later than 1 month from today'
                            }
                            return true // Date is valid
                          }
                        }
                      })}
                      type="date"
                      placeholder="Updated Balance"
                      className="app__input_standard"
                    />
                    {errors.date_of_next_increment && (
                      <div className="app__error_message">
                        {errors.date_of_next_increment.message}
                      </div>
                    )}
                  </div>
                )}
                <div className="mb-2 w-full">
                  <div className="app__label_standard">
                    Remarks{' '}
                    <span className="text-[11px] text-gray-500">
                      (Reason for this adjustment)
                    </span>
                    :
                  </div>
                  <input
                    {...register('remarks', { required: true })}
                    type="text"
                    className="app__input_standard"
                  />
                  {errors.remarks && (
                    <div className="app__error_message">
                      Reason for this adjustment is required
                    </div>
                  )}
                </div>
                <div className="mb-2 w-full">
                  <label className="flex items-center space-x-2">
                    <input
                      {...register('confirmed', { required: true })}
                      type="checkbox"
                      className=""
                    />
                    <span className="font-normal text-xs text-gray-600">
                      By checking this box, you acknowledge that all information
                      is accurate and cannot be modified after submission.
                    </span>
                  </label>
                  {errors.confirmed && (
                    <div className="app__error_message">
                      Confirmation is required
                    </div>
                  )}
                </div>
                <div className="mb-2 w-full space-x-2">
                  <CustomButton
                    containerStyles="app__btn_green"
                    title="Submit"
                    btnType="submit"
                  />
                  <CustomButton
                    containerStyles="app__btn_gray"
                    title="Cancel"
                    btnType="button"
                    handleClick={() => setShowAdjustmentForm(false)}
                  />
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-end mt-2 mb-2 px-4">
        <div className="space-x-1">
          <LeaveBalanceBoxes user={userData} />
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-4">
        <table className="app__table">
          <thead className="app__thead">
            <tr>
              <th className="app__th">Adjustment Date</th>
              <th className="app__th">Particulars</th>
              <th className="app__th">Credits Used</th>
              <th className="app__th">Credits Earned</th>
              <th className="app__th">Balance</th>
              <th className="app__th">Absence w/out Pay</th>
              <th className="app__th">Absence w/ Pay</th>
              <th className="app__th">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {!isDataEmpty &&
              list.map((item, index) => (
                <tr key={index} className="app__tr">
                  <td className="app__td">
                    {format(new Date(item.adjustment_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="app__td">{item.particulars}</td>
                  <td className="app__td">{item.credits_used}</td>
                  <td className="app__td">{item.credits_earned}</td>
                  <td className="app__td">{item.balance}</td>
                  <td className="app__td">{item.absence_without_pay}</td>
                  <td className="app__td">{item.absence_with_pay}</td>
                  <td className="app__td">
                    <div>{item.remarks}</div>
                    {item.updater && (
                      <div className="text-[10px] mt-2">
                        <span>Updated by:</span>{' '}
                        <UserBlock user={item.updater} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            {loading && <TableRowLoading cols={8} rows={2} />}
          </tbody>
        </table>
        {!loading && isDataEmpty && (
          <div className="app__norecordsfound">No records found.</div>
        )}
      </div>

      {/* Show More */}
      {list.length < countResults && (
        <ShowMore handleShowMore={handleShowMore} />
      )}
    </div>
  )
}
