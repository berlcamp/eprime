import { CustomButton } from '@/components/index'
import { personnelActions, separationCauses } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { add, format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { Employee, ServiceRecordTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: ServiceRecordTypes | null
  userId: string
}

const AddEditModal = ({ hideModal, editData, userId }: ModalProps) => {
  const { setToast, session } = useFilter()
  const { supabase, systemUsers } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const user: Employee = systemUsers.find(
    (user: Employee) => user.id === userId
  )

  const {
    register,
    formState: { errors },
    reset,
    watch,
    handleSubmit
  } = useForm<ServiceRecordTypes>({
    mode: 'onSubmit'
  })

  const [isCurrent, setIsCurrent] = useState(true)

  const personnelAction = watch('personnel_action')
  const isSeparation =
    personnelAction === 'Separation' || personnelAction === 'Retirement'

  const onSubmit = async (formdata: ServiceRecordTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  // Treat 'Present' / empty as infinite future for interval math
  const toTime = (d: string) =>
    !d || d === 'Present' ? Number.MAX_SAFE_INTEGER : new Date(d).getTime()
  const fromTime = (d: string) => new Date(d).getTime()

  // Validates overlap and auto-closes prior 'Present' rows when isCurrent=true.
  // Returns an error message on failure, or null on success (side-effects applied).
  const runDateGuards = async (
    newFrom: string,
    newTo: string,
    current: boolean,
    excludeId: string | null
  ): Promise<string | null> => {
    if (!newFrom) return 'From date is required.'
    if (!current && !newTo) return 'To date is required.'
    if (!current && fromTime(newFrom) > toTime(newTo))
      return 'From date must be on or before To date.'

    const { data: existing } = await supabase
      .from('hrm_service_records')
      .select('id, from, to')
      .eq('user_id', userId)

    const rows = (existing ?? []).filter(
      (r: any) => !excludeId || r.id !== excludeId
    )

    const newFromT = fromTime(newFrom)
    const newToT = current ? Number.MAX_SAFE_INTEGER : toTime(newTo)

    // Auto-close set: only when this entry is the new 'Present' line. Prior
    // Present rows whose `from` precedes the new `from` get their `to` set to
    // the day before the new `from`. Other Present rows (with from >= newFrom)
    // are NOT auto-closed — that would corrupt a chronologically later line.
    const autoCloseIds: string[] = current
      ? rows
          .filter(
            (r: any) => r.to === 'Present' && fromTime(r.from) < newFromT
          )
          .map((r: any) => r.id)
      : []

    // Overlap check for everything not in the auto-close set
    const overlap = rows.find((r: any) => {
      if (autoCloseIds.includes(r.id)) return false
      const eFrom = fromTime(r.from)
      const eTo = toTime(r.to)
      return newFromT <= eTo && eFrom <= newToT
    })
    if (overlap) {
      return 'Date range overlaps with an existing service record entry.'
    }

    if (autoCloseIds.length > 0) {
      const dayBefore = format(
        add(new Date(newFrom), { days: -1 }),
        'yyyy-MM-dd'
      )
      const { error } = await supabase
        .from('hrm_service_records')
        .update({ to: dayBefore })
        .in('id', autoCloseIds)
      if (error) {
        void logError(
          'Close previous Present service records',
          'hrm_service_records',
          JSON.stringify({ ids: autoCloseIds, new_to: dayBefore }),
          error.message
        )
        return 'Failed to close the previous active service record.'
      }
    }

    return null
  }

  const handleCreate = async (formdata: ServiceRecordTypes) => {
    const toValue = isCurrent ? 'Present' : formdata.to
    const guardError = await runDateGuards(
      formdata.from,
      toValue,
      isCurrent,
      null
    )
    if (guardError) {
      setToast('error', guardError)
      setSaving(false)
      return
    }

    const newData = {
      user_id: userId,
      org_id: process.env.NEXT_PUBLIC_ORG_ID,
      from: formdata.from,
      to: toValue,
      designation: formdata.designation,
      days_without_pay: formdata.days_without_pay,
      status: formdata.status,
      salary: formdata.salary,
      station: formdata.station,
      branch: formdata.branch,
      separation_date: formdata.separation_date,
      separation_cause: formdata.separation_cause,
      personnel_action: formdata.personnel_action,
      remarks: formdata.remarks,
      created_by: session?.user.id
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('hrm_service_records')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create service record',
          'hrm_service_records',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      newId = data[0].id // newly created ID use this on 'finally' block

      // Append new data in redux
      const updatedData = { ...newData, hrm_user: user, id: newId }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1
        })
      )

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: ServiceRecordTypes) => {
    if (!editData) return

    const toValue = isCurrent ? 'Present' : formdata.to
    const guardError = await runDateGuards(
      formdata.from,
      toValue,
      isCurrent,
      editData.id
    )
    if (guardError) {
      setToast('error', guardError)
      setSaving(false)
      return
    }

    const newData = {
      from: formdata.from,
      to: toValue,
      designation: formdata.designation,
      days_without_pay: formdata.days_without_pay,
      status: formdata.status,
      salary: formdata.salary,
      station: formdata.station,
      branch: formdata.branch,
      separation_date: formdata.separation_date,
      separation_cause: formdata.separation_cause,
      personnel_action: formdata.personnel_action,
      remarks: formdata.remarks,
      created_by: session?.user.id
    }

    try {
      const { error } = await supabase
        .from('hrm_service_records')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update service record',
          'hrm_service_records',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, hrm_user: user, id: editData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  // On open / edit: initialise "Currently holds this position" based on editData.
  useEffect(() => {
    setIsCurrent(editData ? editData.to === 'Present' : true)
  }, [editData])

  // Force isCurrent=false when personnel action implies separation.
  useEffect(() => {
    if (isSeparation) setIsCurrent(false)
  }, [isSeparation])

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      from: editData ? editData.from : '',
      to: editData ? editData.to : '',
      designation: editData ? editData.designation : '',
      days_without_pay: editData ? editData.days_without_pay : '',
      status: editData ? editData.status : '',
      salary: editData ? editData.salary : '',
      station: editData ? editData.station : '',
      branch: editData ? editData.branch : '',
      separation_date: editData ? editData.separation_date : '',
      separation_cause: editData ? editData.separation_cause : '',
      personnel_action: editData ? editData.personnel_action : '',
      remarks: editData ? editData.remarks : ''
    })
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Service Record Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="app__form_field_container">
                <div className="app__label_standard">
                  <span>Employee: </span>
                  <span className="font-bold">
                    {user.firstname} {user.middlename} {user.lastname}
                  </span>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Personnel Action
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div>
                    <select
                      {...register('personnel_action', { required: true })}
                      className="app__input_standard"
                    >
                      <option value="">Select Personnel Action</option>
                      {personnelActions.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                    {errors.personnel_action && (
                      <div className="app__error_message">
                        Personnel Action is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-4 w-full">
                {/* Column 1 */}
                <div className="w-1/2">
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        From (date)
                        <span className="text-red-500 ml-1">*</span>
                      </div>
                      <div>
                        <input
                          {...register('from', { required: true })}
                          type="text"
                          placeholder="MM/DD/YYYY"
                          className="app__select_standard"
                        />
                        {errors.from && (
                          <div className="app__error_message">
                            From Date is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={isCurrent}
                          disabled={isSeparation}
                          onChange={(e) => setIsCurrent(e.target.checked)}
                        />
                        <span>
                          Currently holds this position (To = Present)
                        </span>
                      </label>
                      {isSeparation && (
                        <div className="text-xs text-gray-500 mt-1">
                          Disabled because Personnel Action is{' '}
                          {personnelAction}.
                        </div>
                      )}
                    </div>
                  </div>
                  {!isCurrent && (
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">
                          To (date)
                          <span className="text-red-500 ml-1">*</span>
                        </div>
                        <div>
                          <input
                            {...register('to', { required: !isCurrent })}
                            type="text"
                            placeholder="MM/DD/YYYY"
                            className="app__select_standard"
                          />
                          {errors.to && (
                            <div className="app__error_message">
                              To Date is required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Designation
                        <span className="text-red-500 ml-1">*</span>
                      </div>
                      <div>
                        <input
                          {...register('designation', { required: true })}
                          type="text"
                          placeholder="Designation"
                          className="app__select_standard"
                        />
                        {errors.designation && (
                          <div className="app__error_message">
                            Designation is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        No of Days Without Pay
                      </div>
                      <div>
                        <input
                          {...register('days_without_pay', {
                            min: {
                              value: 0,
                              message: 'Cannot be negative',
                            },
                          })}
                          type="number"
                          min={0}
                          step="1"
                          placeholder="No of Days Without Pay"
                          className="app__input_standard"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Status
                        <span className="text-red-500 ml-1">*</span>
                      </div>
                      <div>
                        <input
                          {...register('status', { required: true })}
                          type="text"
                          placeholder="Status"
                          className="app__select_standard"
                        />
                        {errors.status && (
                          <div className="app__error_message">
                            Status is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Salary
                        <span className="text-red-500 ml-1">*</span>
                      </div>
                      <div>
                        <input
                          {...register('salary', { required: true })}
                          type="text"
                          placeholder="Salary"
                          className="app__select_standard"
                        />
                        {errors.salary && (
                          <div className="app__error_message">
                            Salary is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* End - Column 1 */}
                {/* Column 2 */}
                <div className="w-1/2">
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Station
                        <span className="text-red-500 ml-1">*</span>
                      </div>
                      <div>
                        <input
                          {...register('station', { required: true })}
                          type="text"
                          placeholder="Station"
                          className="app__select_standard"
                        />
                        {errors.station && (
                          <div className="app__error_message">
                            Station is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Branch
                        <span className="text-red-500 ml-1">*</span>
                      </div>
                      <div>
                        <input
                          {...register('branch', { required: true })}
                          type="text"
                          placeholder="Branch"
                          className="app__select_standard"
                        />
                        {errors.branch && (
                          <div className="app__error_message">
                            Branch is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Separation Date
                        {isSeparation && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      <div>
                        <input
                          {...register('separation_date', {
                            required: isSeparation
                          })}
                          type="text"
                          placeholder="MM/DD/YYYY"
                          className="app__select_standard"
                        />
                        {errors.separation_date && (
                          <div className="app__error_message">
                            Separation Date is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Separation Cause
                        {isSeparation && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      <div>
                        <select
                          {...register('separation_cause', {
                            required: isSeparation
                          })}
                          className="app__input_standard"
                        >
                          <option value="">Select Separation Cause</option>
                          {separationCauses.map((cause) => (
                            <option key={cause} value={cause}>
                              {cause}
                            </option>
                          ))}
                        </select>
                        {errors.separation_cause && (
                          <div className="app__error_message">
                            Separation Cause is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Remarks</div>
                      <div>
                        <input
                          {...register('remarks')}
                          type="text"
                          placeholder="Remarks"
                          className="app__select_standard"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* End - Column 2 */}
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? 'Saving...' : 'Submit'}
                  containerStyles="app__btn_green"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEditModal
