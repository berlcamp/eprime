import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'
import { format } from 'date-fns'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import CustomButton from '../CustomButton'
import TwoColTableLoading from '../Loading/TwoColTableLoading'

interface FormRowTypes {
  nanoid: string
  title: string
  from: string
  to: string
  hours: string
  cpd_units: string
  type: string
  sponsor: string
  status: string
}

interface WorkExperienceTypes {
  work_experience: string
  confirmed: string
}

export default function Trainings({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [trainingsArray, setTrainingsArray] = useState<FormRowTypes[] | []>([])
  const [showAddRow, setShowAddRow] = useState(false)

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<FormRowTypes>({
    mode: 'onSubmit'
  })

  const {
    register: register2,
    formState: { errors: errors2 },
    handleSubmit: handleSubmit2
  } = useForm<WorkExperienceTypes>({
    mode: 'onSubmit'
  })

  const onSubmitRow = async (formdata: FormRowTypes) => {
    setTrainingsArray([
      {
        nanoid: nanoid(),
        title: formdata.title,
        from: formdata.from,
        to: formdata.to,
        hours: formdata.hours,
        cpd_units: formdata.cpd_units,
        type: formdata.type,
        sponsor: formdata.sponsor,
        status: 'Pending Approval'
      },
      ...trainingsArray
    ])

    reset()
    setShowAddRow(false)
  }

  const onSubmit = async () => {
    if (saving) return

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      trainings: trainingsArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError(
        'Update L and D Trainings PDS',
        'hrm_pds',
        JSON.stringify(newData),
        error.message
      )
      setToast('error', 'Saving failed, please reload the page and try again.')
    } else {
      setToast('success', 'Successfully saved.')
    }

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
      if (data.trainings) {
        setTrainingsArray(data.trainings)
      }
    }

    setLoading(false)
  }

  const handleInlineEdit = (index: number, newValue: string, field: string) => {
    // Create a new array with the updated value for the specific field
    const updatedArray = trainingsArray.map(
      (item, idx) => (idx === index ? { ...item, [field]: newValue } : item) // Dynamically set the field
    )
    setTrainingsArray(updatedArray)
  }

  const HandleRemoveItem = (item: FormRowTypes) => {
    const updatedData = trainingsArray.filter((e) => e.nanoid !== item.nanoid)
    setTrainingsArray(updatedData)
  }
  const HandleApproveItem = async (item: FormRowTypes) => {
    if (saving) return

    // Function to update object and add a new key-value pair
    const updateObjectInArray = (
      array: FormRowTypes[],
      nanoid: string,
      newKey: string,
      newValue: string
    ) => {
      return array.map((obj) =>
        obj.nanoid === nanoid
          ? { ...obj, [newKey]: newValue } // Add new key-value to the object
          : obj
      )
    }

    const updatedTrainingArray = updateObjectInArray(
      trainingsArray,
      item.nanoid,
      'status',
      'Approved'
    )
    setTrainingsArray(updatedTrainingArray)

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      trainings: updatedTrainingArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError(
        'Update L and D Trainings PDS',
        'hrm_pds',
        JSON.stringify(newData),
        error.message
      )
      setToast('error', 'Saving failed, please reload the page and try again.')
    } else {
      setToast('success', 'Successfully saved.')
    }

    setSaving(false)
  }

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
                Learning and Development (L&D) Interventions/Training Programs
                Attended
              </div>
              <div className="flex-grow bg-gray-300 h-px"></div>
            </div>
            <div className="w-full">
              {trainingsArray.length > 0 && (
                <table className="app__table mb-4">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th"></th>
                      <th className="app__th">
                        Title of L&D Intervention/Training Programs
                      </th>
                      <th className="app__th">Inclusive Dates</th>
                      <th className="app__th">Number of Hours</th>
                      <th className="app__th">CPD Units</th>
                      <th className="app__th">Type of LD</th>
                      <th className="app__th">Conducted / Sponsored By</th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingsArray.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">
                          {hasAccess('ld_training_approver') &&
                            item.status !== 'Approved' && (
                              <CustomButton
                                containerStyles="app__btn_blue"
                                title="Approve"
                                btnType="button"
                                handleClick={() => HandleApproveItem(item)}
                              />
                            )}
                        </td>
                        <td className="app__td">
                          {userId === session.user.id &&
                          item.status !== 'Approved' ? (
                            <div>
                              <input
                                value={item.title}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'title'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.title}</div>
                          )}
                          {item.status === 'Approved' ? (
                            <span className="text-green-600 font-medium">
                              Approved
                            </span>
                          ) : (
                            <span className="text-orange-600 font-medium">
                              Pending Approval
                            </span>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session.user.id &&
                          item.status !== 'Approved' ? (
                            <div>
                              <div className="flex items-start space-x-1">
                                <span>From: </span>
                                <input
                                  type="date"
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
                                  type="date"
                                  value={item.to}
                                  onChange={(e) =>
                                    handleInlineEdit(
                                      index,
                                      e.target.value,
                                      'to'
                                    )
                                  }
                                  className="utline-none focus:outline-none focus:ring-0 inline-flex"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              {format(new Date(item.from), 'MMM d, yyyy')} -{' '}
                              {format(new Date(item.to), 'MMM d, yyyy')}
                            </div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session.user.id &&
                          item.status !== 'Approved' ? (
                            <div>
                              <input
                                type="number"
                                step="any"
                                value={item.hours}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'hours'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.hours}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session.user.id &&
                          item.status !== 'Approved' ? (
                            <div>
                              <input
                                type="number"
                                step="any"
                                value={item.cpd_units}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'cpd_units'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.cpd_units}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session.user.id &&
                          item.status !== 'Approved' ? (
                            <div>
                              <input
                                value={item.type}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'type'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.type}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session.user.id &&
                          item.status !== 'Approved' ? (
                            <div>
                              <input
                                value={item.sponsor}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'sponsor'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.sponsor}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session.user.id && (
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
          {userId === session.user.id && (
            <>
              <div className="app__pds_add_row_container">
                <form onSubmit={handleSubmit(onSubmitRow)} className="text-xs">
                  {!showAddRow ? (
                    <CustomButton
                      containerStyles="app__btn_blue"
                      title="Add New Training"
                      btnType="button"
                      handleClick={() => setShowAddRow(true)}
                    />
                  ) : (
                    <div className="w-2/3 space-y-4">
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Title of L&D Intervention/Training Programs{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full)
                          </span>
                          :
                        </div>
                        <input
                          {...register('title', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.title && (
                          <div className="app__error_message">
                            Title of L&D Intervention/Training Programs is
                            required
                          </div>
                        )}
                      </div>
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
                        <div className="app__label_standard">
                          Inclusive Dates (To):
                        </div>
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
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Number of Hours:
                        </div>
                        <input
                          {...register('hours', { required: true })}
                          type="number"
                          className="app__input_standard"
                        />
                        {errors.hours && (
                          <div className="app__error_message">
                            Number of Hours is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">CPD Units:</div>
                        <input
                          {...register('cpd_units', { required: true })}
                          type="number"
                          className="app__input_standard"
                        />
                        {errors.cpd_units && (
                          <div className="app__error_message">
                            CPD Units is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Type of LD (Managerial/Supervisory/Technical/etc):
                        </div>
                        <input
                          {...register('type', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.type && (
                          <div className="app__error_message">
                            Type of LD is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Conducted/ Sponsored By{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full)
                          </span>
                          :
                        </div>
                        <input
                          {...register('sponsor', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.sponsor && (
                          <div className="app__error_message">
                            Conducted/ Sponsored By is required
                          </div>
                        )}
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
              <form onSubmit={handleSubmit2(onSubmit)} className="w-full">
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
