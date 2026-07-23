import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import CustomButton from '../CustomButton'
import TwoColTableLoading from '../Loading/TwoColTableLoading'
import { notifyInvalid } from './notifyInvalid'
import { useReportPdsDirty } from './pdsDirty'
import { hasPendingEntry, pendingEntryMessage } from './pendingEntry'
import { savePds } from './savePds'

interface FormRowTypes {
  nanoid: string
  from: string
  to: string
  present: boolean
  position_title: string
  company: string
  monthly_salary: string
  salary_grade: string
  status: string
  government_service: string
}

interface WorkExperienceTypes {
  work_experience: string
  confirmed: string
}

export default function WorkExperience({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [workExperienceArray, setWorkExperienceArray] = useState<
    FormRowTypes[] | []
  >([])
  const [showAddRow, setShowAddRow] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const {
    register,
    formState: { errors },
    reset,
    watch,
    getValues,
    handleSubmit
  } = useForm<FormRowTypes>({
    mode: 'onSubmit'
  })

  // Watching a specific field value
  const isPresent = watch('present', false)

  const {
    register: register2,
    formState: { errors: errors2 },
    handleSubmit: handleSubmit2
  } = useForm<WorkExperienceTypes>({
    mode: 'onSubmit'
  })

  const onSubmitRow = async (formdata: FormRowTypes) => {
    setWorkExperienceArray([
      {
        nanoid: nanoid(),
        from: formdata.from,
        to: formdata.to,
        present: formdata.present,
        position_title: formdata.position_title,
        company: formdata.company,
        monthly_salary: formdata.monthly_salary,
        salary_grade: formdata.salary_grade,
        status: formdata.status,
        government_service: formdata.government_service
      },
      ...workExperienceArray
    ])

    reset()
    setShowAddRow(false)
    setHasUnsavedChanges(true)
  }

  const onSubmit = async () => {
    if (saving) return

    // The Add form is separate from this one, so an entry that was typed but
    // never added would be dropped without a word.
    if (showAddRow && hasPendingEntry(getValues())) {
      setToast('error', pendingEntryMessage)
      return
    }

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      work_experience: workExperienceArray
    }

    const { ok, message } = await savePds(
      supabase,
      'Update Work Experience PDS',
      newData
    )

    if (ok) setHasUnsavedChanges(false)
    setToast(ok ? 'success' : 'error', message)

    setSaving(false)
  }

  const fetchData = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('hrm_pds')
      .select()
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (data) {
      // transfer the children json to state
      if (data.work_experience) {
        setWorkExperienceArray(data.work_experience)
      }
    }

    if (error) console.log(error.message)

    setLoading(false)
  }

  const HandleRemoveItem = (item: FormRowTypes) => {
    const updatedData = workExperienceArray.filter(
      (e) => e.nanoid !== item.nanoid
    )
    setWorkExperienceArray(updatedData)
    setHasUnsavedChanges(true)
  }

  const handleInlineEdit = (index: number, newValue: string, field: string) => {
    // Create a new array with the updated value for the specific field
    const updatedArray = workExperienceArray.map(
      (item, idx) => (idx === index ? { ...item, [field]: newValue } : item) // Dynamically set the field
    )
    setWorkExperienceArray(updatedArray)
    setHasUnsavedChanges(true)
  }

  useReportPdsDirty(
    () => hasUnsavedChanges || (showAddRow && hasPendingEntry(getValues()))
  )

  useEffect(() => {
    void fetchData()
  }, [])

  return (
    <div className="w-full">
      {loading && <TwoColTableLoading />}
      {!loading && (
        <div className="w-full">
          <div className="w-full px-4">
            <div className="flex items-center">
              <div className="flex-grow bg-gray-300 h-px"></div>
              <div className="mx-4 my-4 text-gray-500 text-sm">
                Work Experience
              </div>
              <div className="flex-grow bg-gray-300 h-px"></div>
            </div>
            <div className="w-full">
              {workExperienceArray.length > 0 && (
                <table className="app__table mb-4">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">Inclusive Dates</th>
                      <th className="app__th">Position</th>
                      <th className="app__th">
                        Department/Agency/Office/Company
                      </th>
                      <th className="app__th">Montly Salary</th>
                      <th className="app__th">
                        Salary/Job/Pay Grade & Step Increment
                      </th>
                      <th className="app__th">Status of Appointment</th>
                      <th className="app__th">Govt Service</th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workExperienceArray.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-1">
                              <span>From: </span>
                              <input
                                value={item.from}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'from'
                                  )
                                }
                                className="outline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                            <div className="flex items-start space-x-1">
                              <span>To: </span>
                              <input
                                value={item.present ? 'Present' : item.to}
                                onChange={(e) =>
                                  handleInlineEdit(index, e.target.value, 'to')
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.position_title}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'position_title'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.position_title}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.company}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'company'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.company}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.monthly_salary}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'monthly_salary'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.monthly_salary}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.salary_grade}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'salary_grade'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.salary_grade}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.status}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'status'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.status}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.government_service}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'government_service'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.government_service}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id && (
                            <CustomButton
                              containerStyles="app__btn_red"
                              title="Remove"
                              btnType="button"
                              handleClick={() => HandleRemoveItem(item)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {userId === session?.user.id && (
            <>
              <div className="app__pds_add_row_container">
                <form onSubmit={handleSubmit(onSubmitRow, notifyInvalid(setToast))} className="text-xs">
                  {!showAddRow ? (
                    <CustomButton
                      containerStyles="app__btn_blue"
                      title="Add Work Experience"
                      btnType="button"
                      handleClick={() => setShowAddRow(true)}
                    />
                  ) : (
                    <div className="w-2/3 space-y-4">
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Inclusive Dates (From):
                        </div>
                        <input
                          {...register('from', { required: true })}
                          type="date"
                          className="app__input_standard"
                        />
                        {errors.from && (
                          <div className="app__error_message">
                            Date is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard flex items-center justify-start">
                          <span className="mr-4">Inclusive Dates (To):</span>
                          <input
                            {...register('present')}
                            type="checkbox"
                            id="present"
                            className="mr-1"
                          />
                          <label htmlFor="present">Present</label>
                        </div>
                        {!isPresent && (
                          <>
                            <input
                              {...register('to', { required: true })}
                              type="date"
                              className="app__input_standard"
                            />
                            {errors.to && (
                              <div className="app__error_message">
                                Date is required
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Position Title{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full/Do not abbreviate)
                          </span>
                          :
                        </div>
                        <input
                          {...register('position_title', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.position_title && (
                          <div className="app__error_message">
                            Position Title is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Department/Agency/Office/Company{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full/Do not abbreviate)
                          </span>
                          :
                        </div>
                        <input
                          {...register('company', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.company && (
                          <div className="app__error_message">
                            Department/Agency/Office/Company is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Monthly Salary:
                        </div>
                        <input
                          {...register('monthly_salary', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.monthly_salary && (
                          <div className="app__error_message">
                            Monthly Salary is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Salary Job/Pay Grade{' '}
                          <span className="text-gray-500 text-[11px]">
                            (if applicable)
                          </span>{' '}
                          & Step{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Format &quot;00-0&quot;) INCREMENT
                          </span>
                          :
                        </div>
                        <input
                          {...register('salary_grade')}
                          type="text"
                          className="app__input_standard"
                        />
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Status of Appointment:
                        </div>
                        <input
                          {...register('status')}
                          type="text"
                          className="app__input_standard"
                        />
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Gov&apos;t Service (Y/N):
                        </div>
                        <input
                          {...register('government_service')}
                          type="text"
                          className="app__input_standard"
                        />
                      </div>
                      <div className="mb-2 w-full space-x-2">
                        <CustomButton
                          containerStyles="app__btn_green"
                          title="Add"
                          btnType="submit"
                        />
                        <CustomButton
                          containerStyles="app__btn_gray"
                          title="Cancel"
                          btnType="button"
                          handleClick={() => setShowAddRow(false)}
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>
              <hr className="my-6 mx-4" />
              <form onSubmit={handleSubmit2(onSubmit, notifyInvalid(setToast))} className="w-full">
                <div className="w-full px-4">
                  <div className="app__label_standard">
                    <label className="flex items-center space-x-1">
                      <input
                        {...register2('confirmed', { required: true })}
                        type="checkbox"
                        className=""
                      />
                      <span className="font-normal text-xs">
                        By checking this box, you acknowledge that all
                        information is accurate and up-to-date.
                      </span>
                    </label>
                    {errors2.confirmed && (
                      <div className="app__error_message">
                        Confirmation is required
                      </div>
                    )}
                  </div>
                </div>
                <div className="app__modal_footer_left mx-4 mt-4">
                  <button type="submit" className="app__btn_green_sm">
                    {saving ? 'Saving..' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
