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
  level: string
  school: string
  course: string
  from: string
  to: string
  level_earned: string
  year_graduated: string
  scholarship_received: string
}

interface EducationalBackgroundTypes {
  educational_background: string
  confirmed: string
}

export default function EducationalBackground({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [educationArray, setEducationArray] = useState<FormRowTypes[] | []>([])
  const [showAddRow, setShowAddRow] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    handleSubmit
  } = useForm<FormRowTypes>({
    mode: 'onSubmit'
  })

  const {
    register: register2,
    formState: { errors: errors2 },
    handleSubmit: handleSubmit2
  } = useForm<EducationalBackgroundTypes>({
    mode: 'onSubmit'
  })

  const onSubmitRow = async (formdata: FormRowTypes) => {
    setEducationArray([
      {
        nanoid: nanoid(),
        level: formdata.level,
        school: formdata.school,
        course: formdata.course,
        from: formdata.from,
        to: formdata.to,
        level_earned: formdata.level_earned,
        year_graduated: formdata.year_graduated,
        scholarship_received: formdata.scholarship_received
      },
      ...educationArray
    ])

    reset()
    setShowAddRow(false)
    setHasUnsavedChanges(true)
  }

  const onSubmit = async () => {
    if (saving) return

    // The Add form is separate from this one, so a row that was typed but never
    // added would be dropped without a word.
    if (showAddRow && hasPendingEntry(getValues())) {
      setToast('error', pendingEntryMessage)
      return
    }

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      educational_background: educationArray
    }

    const { ok, message } = await savePds(
      supabase,
      'Update Educational Background',
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
      if (data.educational_background) {
        setEducationArray(data.educational_background)
      }
    }

    if (error) console.log(error.message)

    setLoading(false)
  }

  const HandleRemoveItem = (item: FormRowTypes) => {
    const updatedData = educationArray.filter((e) => e.nanoid !== item.nanoid)
    setEducationArray(updatedData)
    setHasUnsavedChanges(true)
  }

  const handleInlineEdit = (index: number, newValue: string, field: string) => {
    // Create a new array with the updated value for the specific field
    const updatedArray = educationArray.map(
      (item, idx) => (idx === index ? { ...item, [field]: newValue } : item) // Dynamically set the field
    )
    setEducationArray(updatedArray)
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
                Educational Background
              </div>
              <div className="flex-grow bg-gray-300 h-px"></div>
            </div>
            <div className="w-full">
              {educationArray.length > 0 && (
                <table className="app__table mb-4">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">Level</th>
                      <th className="app__th">Name of School</th>
                      <th className="app__th">Basic Education/Degree/Course</th>
                      <th className="app__th">Period of Attendance</th>
                      <th className="app__th">Highest Level/Units Earned</th>
                      <th className="app__th">Year Graduated</th>
                      <th className="app__th">
                        Scholarship/Academic Honors Received
                      </th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {educationArray.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.level}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'level'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.level}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.school}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'school'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.school}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.course}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'course'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.course}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.from}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'from'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.from}</div>
                          )}
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.to}
                                onChange={(e) =>
                                  handleInlineEdit(index, e.target.value, 'to')
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.to}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.level_earned}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'level_earned'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.level_earned}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.year_graduated}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'year_graduated'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.year_graduated}</div>
                          )}
                        </td>
                        <td className="app__td">
                          {userId === session?.user.id ? (
                            <div>
                              <input
                                value={item.scholarship_received}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    index,
                                    e.target.value,
                                    'scholarship_received'
                                  )
                                }
                                className="utline-none focus:outline-none focus:ring-0 inline-flex"
                              />
                            </div>
                          ) : (
                            <div>{item.scholarship_received}</div>
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
                      title="Add Educational Data"
                      btnType="button"
                      handleClick={() => setShowAddRow(true)}
                    />
                  ) : (
                    <div className="w-2/3 space-y-4">
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">Level:</div>
                        <select
                          {...register('level', { required: true })}
                          className="app__select_standard"
                        >
                          <option value="">Choose Level</option>
                          <option value="Elementary">Elementary</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Vocational / Trade Course">
                            Vocational / Trade Course
                          </option>
                          <option value="College">College</option>
                          <option value="Graduate Studies">
                            Graduate Studies
                          </option>
                        </select>
                        {errors.level && (
                          <div className="app__error_message">
                            Level is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Name of School{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full)
                          </span>
                          :
                        </div>
                        <input
                          {...register('school', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.school && (
                          <div className="app__error_message">
                            School Name is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Basic Education/Degree/Course{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full)
                          </span>
                          :
                        </div>
                        <input
                          {...register('course', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.course && (
                          <div className="app__error_message">
                            Education/Degree/Course is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Period of Attendance (From):
                        </div>
                        <input
                          {...register('from', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.from && (
                          <div className="app__error_message">
                            Period of Attendance is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Period of Attendance (To):
                        </div>
                        <input
                          {...register('to', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.to && (
                          <div className="app__error_message">
                            Period of Attendance is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Highest Level/Units Earned{' '}
                          <span className="text-gray-500 text-[11px]">
                            (if not graduated)
                          </span>
                          :
                        </div>
                        <input
                          {...register('level_earned')}
                          type="text"
                          className="app__input_standard"
                        />
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Year Graduated:
                        </div>
                        <input
                          {...register('year_graduated', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.year_graduated && (
                          <div className="app__error_message">
                            Year Graduated is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Scholarship/Academic Honors Received:
                        </div>
                        <input
                          {...register('scholarship_received')}
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
