import { CustomButton, SearchUserInput, UserBlock } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchSalaryGrades, logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { Employee, NosiTypes, SalaryGradeTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { nosiSideEffects } from '@/utils/sideEffectFunctions'
import { format, subDays } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: NosiTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [user, setUser] = useState<Employee | null>(
    editData ? editData.hrm_user : null
  )

  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    watch
  } = useForm<NosiTypes>({
    mode: 'onSubmit'
  })

  const watchedReason = watch('reason')

  const onSubmit = async (formdata: NosiTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: NosiTypes) => {
    if (!user) return

    // Find the matching salary for the employee's grade and step
    const matchingSalary = salaryGrades.find(
      (sg) =>
        sg.grade.toString() === user.salary_grade &&
        sg.step.toString() === formdata.new_step
    )
    const matchingOldSalary = salaryGrades.find(
      (sg) =>
        sg.grade.toString() === user.salary_grade &&
        sg.step.toString() === user.salary_step
    )

    // If a matching salary is found, update the current salary
    const salary = matchingSalary ? matchingSalary.salary : '0'
    const old_salary = matchingOldSalary ? matchingOldSalary.salary : '0'

    const inputDate = new Date(formdata.effective_date) // Convert input value to a Date object
    const as_of_date = subDays(inputDate, 1)

    const newData = {
      user_id: user.id,
      as_of_date: format(as_of_date, 'MM/dd/yyyy'),
      effective_date: format(new Date(formdata.effective_date), 'MM/dd/yyyy'),
      new_grade: user.salary_grade,
      new_step: formdata.new_step,
      new_amount: salary,
      previous_grade: user.salary_grade,
      previous_step: user.salary_step,
      previous_amount: old_salary,
      reason: formdata.reason,
      other_reason: formdata.other_reason
    }

    try {
      const { data, error } = await supabase
        .from('hrm_nosi')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Nosi',
          'hrm_nosi',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      const { status, error: error2 } = await nosiSideEffects(data[0])
      if (error2) {
        void logError(
          'Nosi side effects',
          'hrm_nosi',
          JSON.stringify(error2),
          JSON.stringify(error2)
        )
      }
      console.log('status', status)

      const updatedData = {
        ...newData,
        hrm_user: user ?? null,
        id: data[0].id
      }
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

  const handleUpdate = async (formdata: NosiTypes) => {
    if (!editData) return

    if (!user) return

    // Find the matching salary for the employee's grade and step
    const matchingSalary = salaryGrades.find(
      (sg) =>
        sg.grade.toString() === user.salary_grade &&
        sg.step.toString() === formdata.new_step
    )
    const matchingOldSalary = salaryGrades.find(
      (sg) =>
        sg.grade.toString() === user.salary_grade &&
        sg.step.toString() === user.salary_step
    )

    // If a matching salary is found, update the current salary
    const salary = matchingSalary ? matchingSalary.salary : '0'
    const old_salary = matchingOldSalary ? matchingOldSalary.salary : '0'

    const inputDate = new Date(formdata.effective_date) // Convert input value to a Date object
    const as_of_date = subDays(inputDate, 1)

    const newData = {
      user_id: user.id,
      as_of_date: format(as_of_date, 'MM/dd/yyyy'),
      effective_date: format(new Date(formdata.effective_date), 'MM/dd/yyyy'),
      new_grade: user.salary_grade,
      new_step: formdata.new_step,
      new_amount: salary,
      previous_grade: user.salary_grade,
      previous_step: user.salary_step,
      previous_amount: old_salary,
      reason: formdata.reason,
      other_reason: formdata.other_reason
    }

    try {
      const { error } = await supabase
        .from('hrm_nosi')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update nosi',
          'hrm_nosi',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      const items = [...globallist]
      const updatedData = {
        ...newData,
        id: editData.id
      }
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

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length === 0) {
      setUser(null)
      return
    }

    const [employee] = selectedUsers // extracts the first element from the selectedUsers array
    setUser(employee)
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      as_of_date: editData ? editData.as_of_date : '',
      effective_date: editData ? editData.effective_date : '',
      new_step: editData ? editData.new_step : '',
      reason: editData ? editData.reason : '',
      other_reason: editData ? editData.other_reason : ''
    })
  }, [editData, reset])

  useEffect(() => {
    const fetchSalaryGradesData = async () => {
      const result = await fetchSalaryGrades(999, 0)
      setSalaryGrades(result.data.length > 0 ? result.data : [])
    }

    void fetchSalaryGradesData()
  }, [])

  const stepOptions = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">NOSI Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="app__modal_body min-h-[300px]"
            >
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Employee Name</div>
                  <div>
                    {editData?.hrm_user ? (
                      <UserBlock user={editData.hrm_user} />
                    ) : (
                      <>
                        <SearchUserInput
                          isMultiple={false}
                          handleSelectedUsers={handleSelectedUsers}
                        />
                      </>
                    )}
                  </div>
                  {user && (
                    <div className="border border-blue-500 bg-blue-100 text-xs mt-2 p-1">
                      Current Salary: SG{' '}
                      <span className="font-bold text-sm">
                        {user.salary_grade}
                      </span>
                      , Step{' '}
                      <span className="font-bold text-sm">
                        {user.salary_step}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {user && (
                <>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">New Step</div>
                      <div>
                        <select
                          {...register('new_step', { required: true })}
                          className="app__select_standard"
                        >
                          <option value="">Select</option>
                          {stepOptions
                            .filter(
                              (option) => option > Number(user.salary_step)
                            ) // Filter out values less than or equal to minValue
                            .map((option) => (
                              <option key={option} value={option}>
                                Step {option}
                              </option>
                            ))}
                        </select>
                        {errors.new_step && (
                          <div className="app__error_message">
                            New Step is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Effective Date</div>
                      <div>
                        <input
                          {...register('effective_date', { required: true })}
                          type="date"
                          className="app__input_standard"
                        />
                        {errors.effective_date && (
                          <div className="app__error_message">
                            Effective Date is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Reason for Increment
                      </div>
                      <div className="flex flex-col items-start justify-center space-y-2">
                        <label className="text-xs space-x-2">
                          <input
                            type="radio"
                            value="Due to meritorious performance - 2 Step increment for those who attained 2 ratings of 'Outstanding' during the 2 rating period within the calendar year"
                            {...register('reason', { required: true })}
                          />
                          <span>
                            Due to meritorious performance - 2 Step increment
                            for those who attained 2 ratings of 'Outstanding'
                            during the 2 rating period within the calendar year
                          </span>
                        </label>

                        <label className="text-xs space-x-2">
                          <input
                            type="radio"
                            value="Due to meritorious performance - 1 Step increment for those who attained 1 rating of 'Outstanding' and 1 rating of 'Very Satisfactory' during the 2 rating period within the calendar year"
                            {...register('reason', { required: true })}
                          />
                          <span>
                            Due to meritorious performance - 1 Step increment
                            for those who attained 1 rating of 'Outstanding' and
                            1 rating of 'Very Satisfactory' during the 2 rating
                            period within the calendar year
                          </span>
                        </label>

                        <label className="text-xs space-x-2">
                          <input
                            type="radio"
                            value="Other"
                            {...register('reason', { required: true })}
                          />
                          <span>Other</span>
                        </label>

                        {errors.reason && (
                          <div className="app__error_message">
                            Reason is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {watchedReason === 'Other' && (
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">Other Reason</div>
                        <div>
                          <textarea
                            {...register('other_reason', { required: true })}
                            className="app__input_standard"
                          />
                          {errors.other_reason && (
                            <div className="app__error_message">
                              Other Reason is required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <hr className="my-6" />
                  <div className="w-full">
                    <div className="app__label_standard">
                      <label className="flex items-center space-x-1">
                        <input
                          {...register('confirmed', { required: true })}
                          type="checkbox"
                          className=""
                        />
                        <span className="font-normal text-xs">
                          By checking this box, you acknowledge that all
                          information is accurate and up-to-date.
                        </span>
                      </label>
                      {errors.confirmed && (
                        <div className="app__error_message">
                          Confirmation is required
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="app__modal_footer">
                    <button type="submit" className="app__btn_green_sm">
                      {saving ? 'Saving..' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEditModal
