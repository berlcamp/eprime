import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import CustomButton from '../CustomButton'
import TwoColTableLoading from '../Loading/TwoColTableLoading'

interface FormRowTypes {
  nanoid: string
  organization_name_address: string
  from: string
  to: string
  present: boolean
  hours: string
  position: string
}

interface WorkExperienceTypes {
  work_experience: string
  confirmed: string
}

export default function VoluntaryWork({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [workExperienceArray, setWorkExperienceArray] = useState<
    FormRowTypes[] | []
  >([])
  const [showAddRow, setShowAddRow] = useState(false)

  const {
    register,
    formState: { errors },
    reset,
    watch,
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

  // Watching a specific field value
  const isPresent = watch('present', false)

  const onSubmitRow = async (formdata: FormRowTypes) => {
    setWorkExperienceArray([
      {
        nanoid: nanoid(),
        organization_name_address: formdata.organization_name_address,
        from: formdata.from,
        to: formdata.to,
        present: formdata.present,
        hours: formdata.hours,
        position: formdata.position
      },
      ...workExperienceArray
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
      voluntary_work_experience: workExperienceArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError(
        'Update Voluntary Work Experience PDS',
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
      if (data.voluntary_work_experience) {
        setWorkExperienceArray(data.voluntary_work_experience)
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
  }

  const handleInlineEdit = (index: number, newValue: string, field: string) => {
    // Create a new array with the updated value for the specific field
    const updatedArray = workExperienceArray.map(
      (item, idx) => (idx === index ? { ...item, [field]: newValue } : item) // Dynamically set the field
    )
    setWorkExperienceArray(updatedArray)
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
                Voluntary Work or Involvement in Civic / Non-Government /
                People/ Voluntary Organizations
              </div>
              <div className="flex-grow bg-gray-300 h-px"></div>
            </div>
            <div className="w-full">
              {workExperienceArray.length > 0 && (
                <table className="app__table mb-4">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">
                        Name and Address of Organization
                      </th>
                      <th className="app__th">Inclusive Dates</th>
                      <th className="app__th">Number of Hours</th>
                      <th className="app__th">Position / Nature of Work</th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workExperienceArray.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.organization_name_address}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'organization_name_address'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.organization_name_address}</div>
                          )}
                        </td>
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
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.position}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'position'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.position}</div>
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
                <form onSubmit={handleSubmit(onSubmitRow)} className="text-xs">
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
                          Name and Address of Organization{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full)
                          </span>
                          :
                        </div>
                        <input
                          {...register('organization_name_address', {
                            required: true
                          })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.from && (
                          <div className="app__error_message">
                            Name and Address of Organization is required
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
                        <div className="app__label_standard">
                          Position / Nature of Work:
                        </div>
                        <input
                          {...register('position', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.position && (
                          <div className="app__error_message">
                            Position / Nature of Work is required
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
