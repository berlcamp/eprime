'use client'

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

interface PageProps {
  userId: string
}

interface AdjustmentTypes {
  type: string
  balance: string
  remarks: string
  confirmed: string
  adjustment_date: string
}

export default function LeaveCard({ userId }: PageProps) {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<LeaveCardTypes[] | []>([])
  const [countResults, setCountResults] = useState(0)
  const [saving, setSaving] = useState(false)

  const [user, setUser] = useState<Employee | null>(null)

  // balance
  const [slBalance, setSlBalance] = useState('')
  const [vlBalance, setVlBalance] = useState('')
  const [scBalance, setScBalance] = useState('')
  const [cocBalance, setCocBalance] = useState('')
  const [plBalance, setPlBalance] = useState('')
  const [splBalance, setPplBalance] = useState('')
  const [rlBalance, setRlBalance] = useState('')
  const [mlBalance, setMlBalance] = useState('')
  const [slbwBalance, setSlbwBalance] = useState('')
  const [mflBalance, setMflBalance] = useState('')
  const [soloPBalance, setSoloPBalance] = useState('')
  const [studyLBalance, setStudyLBalance] = useState('')
  const [vawcBalance, setVawcBalance] = useState('')
  const [selBalance, setSelBalance] = useState('')
  const [alBalance, setAlBalance] = useState('')

  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)

  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()

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
    handleSubmit
  } = useForm<AdjustmentTypes>({
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

      // update the list in redux
      const newList = [
        {
          adjustment_date: format(
            new Date(formdata.adjustment_date),
            'MMM dd, yyyy'
          ),
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
    // fetch user
    void (async () => {
      const { data } = await supabase
        .from('hrm_users')
        .select()
        .eq('id', userId)
        .limit(1)
        .single()

      if (data) {
        setUser(data)
      }
    })()

    // fetch user leave cards
    void fetchData()
  }, [])

  useEffect(() => {
    if (list.length > 0) {
      const plList = list.filter((item) => item.type === 'Paternity Leave')
      const splList = list.filter(
        (item) => item.type === 'Special Privilege Leave'
      )
      const rlList = list.filter((item) => item.type === 'Rehabilitation Leave')
      const mlList = list.filter((item) => item.type === 'Maternity Leave')
      const slbwList = list.filter(
        (item) => item.type === 'Special Leave Benefits For Women'
      )
      const slList = list.filter((item) => item.type === 'Sick Leave')
      const vlList = list.filter((item) => item.type === 'Vacation Leave')
      const scList = list.filter((item) => item.type === 'Service Credit')
      const cocList = list.filter(
        (item) => item.type === 'Compensatory Overtime Credit'
      )
      const mflList = list.filter(
        (item) => item.type === 'Mandatory/Force Leave'
      )
      const soloPList = list.filter((item) => item.type === 'Solo Parent Leave')
      const studyLList = list.filter((item) => item.type === 'Study Leave')
      const selList = list.filter(
        (item) => item.type === 'Special Emergency (Calamity) Leave'
      )
      const vawcList = list.filter((item) => item.type === '10-Day VAWC Leave')
      const alList = list.filter((item) => item.type === 'Adoption Leave')

      // first index of array should be the latest and updated balance
      const slBalance = slList.length > 0 ? slList[0].balance : ''
      const vlBalance = vlList.length > 0 ? vlList[0].balance : ''
      const scBalance = scList.length > 0 ? scList[0].balance : ''
      const cocBalance = cocList.length > 0 ? cocList[0].balance : ''
      const plBalance = plList.length > 0 ? plList[0].balance : ''
      const splBalance = splList.length > 0 ? splList[0].balance : ''
      const rlBalance = rlList.length > 0 ? rlList[0].balance : ''
      const mlBalance = mlList.length > 0 ? mlList[0].balance : ''
      const slbwBalance = slbwList.length > 0 ? slbwList[0].balance : ''
      const mflBalance = mflList.length > 0 ? mflList[0].balance : ''
      const soloPBalance = soloPList.length > 0 ? soloPList[0].balance : ''
      const studyLBalance = studyLList.length > 0 ? studyLList[0].balance : ''
      const vawcBalance = vawcList.length > 0 ? vawcList[0].balance : ''
      const selBalance = selList.length > 0 ? selList[0].balance : ''
      const alBalance = alList.length > 0 ? alList[0].balance : ''

      setSlBalance(slBalance)
      setVlBalance(vlBalance)
      setScBalance(scBalance)
      setCocBalance(cocBalance)
      setPlBalance(plBalance)
      setPplBalance(splBalance)
      setRlBalance(rlBalance)
      setMlBalance(mlBalance)
      setSlbwBalance(slbwBalance)
      setMflBalance(mflBalance)
      setSoloPBalance(soloPBalance)
      setStudyLBalance(studyLBalance)
      setVawcBalance(vawcBalance)
      setSelBalance(selBalance)
      setAlBalance(alBalance)
    }
  }, [user, list])

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
                    <option value="Service Credit">
                      Service Credit Adjustment
                    </option>
                    <option value="Mandatory/Force Leave">
                      Mandatory/Force Leave Adjustment
                    </option>
                    <option value="Solo Parent Leave">
                      Solo Parent Leave Adjustment
                    </option>
                    <option value="Study Leave">Study Leave Adjustment</option>
                    <option value="Special Emergency (Calamity) Leave">
                      Special Emergency (Calamity) Leave Adjustment
                    </option>
                    <option value="10-Day VAWC Leave">
                      10-Day VAWC Leave Adjustment
                    </option>
                    <option value="Adoption Leave">
                      Adoption Leave Adjustment
                    </option>
                    <option value="Paternity Leave">
                      Paternity Leave Adjustment
                    </option>
                    <option value="Special Privilege Leave">
                      Special Privilege Leave Adjustment
                    </option>
                    <option value="Rehabilitation Leave">
                      Rehabilitation Leave Adjustment
                    </option>
                    <option value="Maternity Leave">
                      Maternity Leave Adjustment
                    </option>
                    <option value="Special Leave Benefits For Women">
                      Special Leave Benefits For Women Adjustment
                    </option>
                    <option value="Sick Leave">Sick Leave Adjustment</option>
                    <option value="Vacation Leave">
                      Vacation Leave Adjustment
                    </option>
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
                <div className="mb-2 w-full">
                  <div className="app__label_standard">Adjustment Date:</div>
                  <input
                    {...register('adjustment_date', { required: true })}
                    type="date"
                    placeholder="Updated Balance"
                    className="app__input_standard"
                  />
                  <div className="text-xs text-gray-600 italic mt-1">
                    (Next auto increment will be in 1 month from this adjustment
                    date)
                  </div>
                  {errors.adjustment_date && (
                    <div className="app__error_message">
                      Adjustment Date is required
                    </div>
                  )}
                </div>
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
          {user && user.position_type === 'Teaching' && (
            <>
              <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                Service Credits:&nbsp;{scBalance}
              </span>
            </>
          )}
          {user && user.position_type !== 'Teaching' && (
            <>
              {slBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  SL:&nbsp;{slBalance}
                </span>
              )}

              {vlBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  VL:&nbsp;{vlBalance}
                </span>
              )}
              {cocBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  COC:&nbsp;{cocBalance}
                </span>
              )}

              {plBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Paternity Leave:&nbsp;{plBalance}
                </span>
              )}
              {splBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  SPL:&nbsp;{splBalance}
                </span>
              )}
              {rlBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Rehabilitation Leave:&nbsp;{rlBalance}
                </span>
              )}
              {mlBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Maternity Leave:&nbsp;{mlBalance}
                </span>
              )}
              {slbwBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  SLBW:&nbsp;{slbwBalance}
                </span>
              )}
              {mflBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Mandatory/Force Leave:&nbsp;{mflBalance}
                </span>
              )}
              {soloPBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Solo Parent Leave:&nbsp;{soloPBalance}
                </span>
              )}
              {studyLBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Study Leave:&nbsp;{studyLBalance}
                </span>
              )}
              {selBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Special Emergency Leave:&nbsp;{selBalance}
                </span>
              )}
              {vawcBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  VAWC Leave:&nbsp;{vawcBalance}
                </span>
              )}
              {alBalance !== '' && (
                <span className="border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm">
                  Adoption Leave:&nbsp;{alBalance}
                </span>
              )}
            </>
          )}
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
