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
  }

  const onSubmit = async () => {
    if (saving) return

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      educational_background: educationArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError(
        'Update Educational Background',
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
                        <td className="app__td">{item.level}</td>
                        <td className="app__td">{item.school}</td>
                        <td className="app__td">{item.course}</td>
                        <td className="app__td">
                          {item.from} - {item.to}
                        </td>
                        <td className="app__td">{item.level_earned}</td>
                        <td className="app__td">{item.year_graduated}</td>
                        <td className="app__td">{item.scholarship_received}</td>
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
