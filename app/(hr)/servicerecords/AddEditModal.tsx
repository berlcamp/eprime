import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
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
    (user: Employee) => user.id === session.user.id
  )

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<ServiceRecordTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: ServiceRecordTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: ServiceRecordTypes) => {
    const newData = {
      user_id: userId,
      org_id: process.env.NEXT_PUBLIC_ORG_ID,
      from: formdata.from,
      to: formdata.to,
      designation: formdata.designation,
      days_without_pay: formdata.days_without_pay,
      status: formdata.status,
      salary: formdata.salary,
      station: formdata.station,
      branch: formdata.branch,
      separation_date: formdata.separation_date,
      separation_cause: formdata.separation_cause,
      remarks: formdata.remarks,
      created_by: session.user.id
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

    const newData = {
      from: formdata.from,
      to: formdata.to,
      designation: formdata.designation,
      days_without_pay: formdata.days_without_pay,
      status: formdata.status,
      salary: formdata.salary,
      station: formdata.station,
      branch: formdata.branch,
      separation_date: formdata.separation_date,
      separation_cause: formdata.separation_cause,
      remarks: formdata.remarks,
      created_by: session.user.id
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
      const user: Employee = systemUsers.find(
        (user: Employee) => user.id === session.user.id
      )
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
              <div className="flex space-x-4 w-full">
                {/* Column 1 */}
                <div className="w-1/2">
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">From (date)</div>
                      <div>
                        <input
                          {...register('from', { required: true })}
                          type="date"
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
                      <div className="app__label_standard">To (date)</div>
                      <div>
                        <input
                          {...register('to', { required: true })}
                          type="date"
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
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Designation</div>
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
                          {...register('days_without_pay')}
                          type="number"
                          step="any"
                          placeholder="No of Days Without Pay"
                          className="app__input_standard"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Status</div>
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
                      <div className="app__label_standard">Salary</div>
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
                      <div className="app__label_standard">Station</div>
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
                      <div className="app__label_standard">Branch</div>
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
                      <div className="app__label_standard">Separation Date</div>
                      <div>
                        <input
                          {...register('separation_date')}
                          type="date"
                          placeholder="MM/DD/YYYY"
                          className="app__select_standard"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Separation Cause
                      </div>
                      <div>
                        <input
                          {...register('separation_cause')}
                          type="text"
                          placeholder="Separation Cause"
                          className="app__select_standard"
                        />
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
