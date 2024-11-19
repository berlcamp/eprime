import { CustomButton, SearchUserInput } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchPositions, logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'

// Types
import type { Employee, PositionTypes, RankingTypes } from '@/types'

// Redux imports
import { rankingTypes } from '@/constants'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useFieldArray, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: RankingTypes | null
  refetch: () => void
}

const AddEditModal = ({ hideModal, refetch, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [years, setYears] = useState<number[]>([])

  const [user, setUser] = useState<Employee | null>(
    editData ? editData.chairman : null
  )
  const [positions, setPositions] = useState<PositionTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
    control,
    handleSubmit
  } = useForm<RankingTypes>({
    mode: 'onSubmit',
    defaultValues: {
      chairman_id: ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'qualifications'
  })

  const onSubmit = async (formdata: RankingTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: RankingTypes) => {
    const newData = {
      chairman_id: user ? user.id : null,
      position_id: formdata.position_id,
      type: formdata.type,
      year: formdata.year,
      department: formdata.department,
      description: formdata.description,
      passing_score: formdata.passing_score,
      days_to_comply: formdata.days_to_comply,
      status: formdata.status,
      display_on_portal: formdata.display_on_portal,
      display_on_portal_from: formdata.display_on_portal_from
        ? formdata.display_on_portal_from
        : null,
      display_on_portal_until: formdata.display_on_portal_until
        ? formdata.display_on_portal_until
        : null,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    try {
      const { data, error } = await supabase
        .from('hrm_rankings')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Ranking',
          'hrm_rankings',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Insert qualifications to db
      const insertPromises = formdata.qualifications.map(
        async (qualification) => {
          return supabase.from('hrm_ranking_qualifications').insert({
            ranking_id: data[0].id,
            name: qualification.name,
            description: qualification.description,
            required: qualification.required ? true : false
          })
        }
      )

      await Promise.all(insertPromises)

      // Append new data in redux
      const hrmPosition = positions.find(
        (p) => p.id.toString() === formdata.position_id
      )
      const updatedData = {
        ...newData,
        position: hrmPosition,
        chairman: user ?? null,
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

      // refetch the data of ranking in order to update the qualifications list
      refetch()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: RankingTypes) => {
    if (!editData) return

    const newData = {
      chairman_id: user ? user.id : null,
      position_id: formdata.position_id,
      type: formdata.type,
      year: formdata.year,
      department: formdata.department,
      description: formdata.description,
      passing_score: formdata.passing_score,
      days_to_comply: formdata.days_to_comply,
      status: formdata.status,
      display_on_portal: formdata.display_on_portal,
      display_on_portal_from: formdata.display_on_portal_from
        ? formdata.display_on_portal_from
        : null,
      display_on_portal_until: formdata.display_on_portal_until
        ? formdata.display_on_portal_until
        : null
    }

    try {
      const { error } = await supabase
        .from('hrm_rankings')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update Ranking',
          'hrm_rankings',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Fetch existing qualifications from the database for this position
      const { data: existingQualifications, error: fetchError } = await supabase
        .from('hrm_ranking_qualifications')
        .select('id')
        .eq('ranking_id', editData.id)

      if (fetchError) {
        throw fetchError
      }

      const existingQualificationIds = existingQualifications.map(
        (q: { id: any }) => q.id
      )

      // Separate qualifications into ones that need to be updated or inserted
      const qualificationsToUpdate = formdata.qualifications.filter((q) => q.id) // Has an ID, update existing
      const qualificationsToInsert = formdata.qualifications.filter(
        (q) => !q.id
      ) // No ID, new entry

      // Update existing qualifications
      for (const qual of qualificationsToUpdate) {
        const { error: updateQualError } = await supabase
          .from('hrm_ranking_qualifications')
          .update({
            name: qual.name,
            description: qual.description,
            required: qual.required ? true : false
          })
          .eq('id', qual.id)

        if (updateQualError) {
          throw updateQualError
        }
      }

      // Insert new qualifications
      if (qualificationsToInsert.length > 0) {
        const newQualifications = qualificationsToInsert.map((qual) => ({
          ranking_id: editData.id,
          name: qual.name,
          description: qual.description,
          required: qual.required ? true : false
        }))

        const { error: insertError } = await supabase
          .from('hrm_ranking_qualifications')
          .insert(newQualifications)

        if (insertError) {
          throw insertError
        }
      }

      // Remove qualifications that are no longer in the form
      const formQualificationIds = formdata.qualifications
        .map((q) => q.id)
        .filter((id) => id) // Get ids from form
      const qualificationsToDelete = existingQualificationIds.filter(
        (id: string | undefined) => !formQualificationIds.includes(id)
      ) // IDs not present in the form

      if (qualificationsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('hrm_ranking_qualifications')
          .delete()
          .in('id', qualificationsToDelete) // Remove them from the database

        if (deleteError) {
          throw deleteError
        }
      }

      // Update data in redux
      const hrmPosition = positions.find(
        (p) => p.id.toString() === formdata.position_id?.toString()
      )
      const items = [...globallist]
      const updatedData = {
        ...newData,
        position: hrmPosition,
        chairman: user ?? null,
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

      // refetch the data of ranking in order to update the qualifications list
      refetch()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
      setValue('chairman_id', selectedUsers[0].id)
      clearErrors('chairman_id')
    } else {
      setUser(null)
      setValue('chairman_id', '')
    }
  }

  const handleAddQualification = () => {
    append({ name: '', description: '', required: false }) // Add a blank qualification
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      chairman_id: editData ? editData.chairman_id : '',
      position_id: editData ? editData.position_id : '',
      type: editData ? editData.type : '',
      year: editData ? editData.year : '',
      department: editData ? editData.department : '',
      description: editData ? editData.description : '',
      status: editData ? editData.status : '',
      passing_score: editData ? editData.passing_score : '',
      display_on_portal: editData ? editData.display_on_portal : '',
      display_on_portal_from: editData ? editData.display_on_portal_from : '',
      display_on_portal_until: editData ? editData.display_on_portal_until : '',
      days_to_comply: editData ? editData.days_to_comply : '',
      qualifications: editData
        ? editData.qualifications.map((qual) => ({
            id: qual.id, // Preserve the qualification id
            name: qual.name,
            description: qual.description,
            required: qual.required
          }))
        : [
            {
              name: 'Letter of Intent',
              description:
                'Letter of intent addressed to the Head of Office or highest human resource officer',
              required: true
            },
            {
              name: 'Personal Data Sheet',
              description:
                'Duly accomplished PDS (CS Form No. 212, Revised 2017) and Work Experience Sheet, if applicable',
              required: true
            },
            {
              name: 'PRC/License ID',
              description:
                'Photocopy of valid and updated PRC License/ID, if applicable',
              required: false
            },
            {
              name: 'Certification of Eligibility',
              description:
                'Photocopy of Certificate of Eligibility/Report of Rating, if applicable',
              required: false
            },
            {
              name: 'Scholastic/Academic Record',
              description:
                'Photocopy of scholastic/ academic record such as but not limited to Transcript of Records (TOR) and Diploma, including completion of graduate and post-graduate units/ degrees, if available',
              required: false
            },
            {
              name: 'Certificate/s of Training',
              description:
                'Photocopy of Certificate/s of Training, if applicable',
              required: false
            },
            {
              name: 'Certificate of Employment, Contract of Service, or duly signed Service Record',
              description:
                'Photocopy of Certificate of Employment, Contract of Service, or duly signed Service Record, whichever is/are applicable',
              required: false
            },
            {
              name: 'Latest Appointment,',
              description: 'Photocopy of latest appointment, if applicable',
              required: false
            },
            {
              name: 'Performance Ratings',
              description:
                'Photocopy of the Performance Ratings in the last rating period(s) covering one (1) year performance prior to the deadline of submission, if applicable',
              required: false
            },
            {
              name: 'Checklist of Requirements and Omnibus Sworn Statement',
              description:
                'Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) of the documents submitted and Data Privacy Consent Form',
              required: false
            },
            {
              name: 'Other documents',
              description:
                'Other documents as may be required for comparative assessment, such as but not limited to: Means of Verification (MOVs) showing Outstanding Accomplishments, Application of Education, and Application of Learning and Development reckoned from the date of last issuance of appointment. Photocopy of Performance Rating obtained from the relevant work experience, if performance rating in Item i) is not relevant to the position to be filled',
              required: false
            }
          ]
    })
  }, [editData, positions, reset])

  useEffect(() => {
    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 500, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }

    void fetchPositionsData()

    // set year for select options
    const currentYear = new Date().getFullYear()
    setYears([currentYear, currentYear + 1, currentYear + 2])
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Ranking Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="flex flex-col lg:flex-row w-full items-start justify-start text-xs dark:text-gray-400">
                {/* Begin First Column */}
                <div className="w-full lg:w-5/12 px-2">
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Type</div>
                      <div>
                        {editData && editData.applicants.length > 0 ? (
                          <>
                            <div className="app__label_value">
                              {editData.type}
                            </div>
                          </>
                        ) : (
                          <>
                            <select
                              {...register('type', { required: true })}
                              className="app__select_standard"
                            >
                              <option value="">Choose Type</option>
                              {rankingTypes.map((rt, i) => (
                                <option key={i} value={rt}>
                                  {rt}
                                </option>
                              ))}
                            </select>
                            {errors.type && (
                              <div className="app__error_message">
                                Type is required
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Calendar Year</div>
                      <div>
                        {editData && editData.applicants.length > 0 ? (
                          <>
                            <div className="app__label_value">
                              {editData.year}
                            </div>
                          </>
                        ) : (
                          <>
                            <select
                              {...register('year', { required: true })}
                              className="app__select_standard"
                            >
                              <option value="">Choose</option>
                              {years.map((year) => (
                                <option key={year} value={year.toString()}>
                                  {year}
                                </option>
                              ))}
                            </select>
                            {errors.year && (
                              <div className="app__error_message">
                                Calendar Year is required
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Position:</div>
                      <div>
                        {editData && editData.applicants.length > 0 ? (
                          <>
                            <div className="app__label_value">
                              {editData.position?.name}
                            </div>
                            <div className="app__warning_text !mx-0">
                              Type, Calendar Year and Position can no longer be
                              edited as there are already applicants for this
                              ranking.
                            </div>
                          </>
                        ) : (
                          <>
                            <select
                              {...register('position_id', { required: true })}
                              className="app__select_standard"
                            >
                              <option value="">Choose Position</option>
                              {positions.map(
                                (position: PositionTypes, index) => (
                                  <option key={index} value={position.id}>
                                    {position.name}
                                  </option>
                                )
                              )}
                            </select>
                            {errors.position_id && (
                              <div className="app__error_message">
                                Position is required
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Status</div>
                      <div>
                        <select
                          {...register('status', { required: true })}
                          className="app__select_standard"
                        >
                          <option value="">Choose</option>
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
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
                        Committee Chairman:
                      </div>
                      <SearchUserInput
                        isMultiple={false}
                        selectedUsers={
                          editData
                            ? editData.chairman
                              ? [editData.chairman]
                              : []
                            : []
                        }
                        handleSelectedUsers={handleSelectedUsers}
                      />
                      <input
                        type="hidden"
                        {...register('chairman_id', {
                          required: true
                        })}
                      />
                      {errors.chairman_id && (
                        <div className="app__error_message">
                          Chairman is required
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Department</div>
                      <div>
                        <select
                          {...register('department', { required: true })}
                          className="app__select_standard"
                        >
                          <option value="">Choose</option>
                          <option value="Non-Teaching">Non-Teaching</option>
                          <option value="Elementary">Elementary</option>
                          <option value="Junior High School">
                            Junior High School
                          </option>
                          <option value="Senior High School">
                            Senior High School
                          </option>
                          <option value="Secondary">Secondary</option>
                        </select>
                        {errors.department && (
                          <div className="app__error_message">
                            Department is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Duration of Posting (From)
                      </div>
                      <div>
                        <input
                          {...register('display_on_portal_from', {
                            required: true
                          })}
                          type="date"
                          className="app__input_standard"
                        />
                        {errors.display_on_portal_from && (
                          <div className="app__error_message">
                            This is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Duration of Posting (To)
                      </div>
                      <div>
                        <input
                          {...register('display_on_portal_until', {
                            required: true
                          })}
                          type="date"
                          className="app__input_standard"
                        />
                        {errors.display_on_portal_until && (
                          <div className="app__error_message">
                            This is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Last Day of compliance{' '}
                        <span className="italic font-light">
                          (For disqualified applicants)
                        </span>
                      </div>
                      <div>
                        <input
                          {...register('days_to_comply', {
                            required: true
                          })}
                          type="date"
                          className="app__input_standard"
                        />
                        {errors.days_to_comply && (
                          <div className="app__error_message">
                            Last Day of compliance is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Passing Score</div>
                      <div>
                        <input
                          {...register('passing_score', { required: true })}
                          type="number"
                          className="app__input_standard"
                        />
                        {errors.passing_score && (
                          <div className="app__error_message">
                            Passing Score is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Description</div>
                      <div>
                        <textarea
                          {...register('description', { required: true })}
                          className="app__input_standard"
                        />
                        {errors.description && (
                          <div className="app__error_message">
                            Description is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        <label className="flex items-center space-x-1">
                          <input
                            {...register('display_eir')}
                            type="checkbox"
                            className=""
                          />
                          <span>Display EIR</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        <label className="flex items-center space-x-1">
                          <input
                            {...register('display_on_portal')}
                            type="checkbox"
                            className=""
                          />
                          <span>Display on Website</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* End First Column */}
                {/* Begin Second Column */}
                <div className="flex-1 px-8">
                  <div className="border p-4 bg-white">
                    <div className="text-sm font-semibold text-gray-700 mb-4">
                      Qualification Standards for this Ranking
                    </div>
                    {fields.map((_q, index) => (
                      <div key={index} className="app__form_field_container">
                        <div>
                          <div className="flex items-center justify-start space-x-2">
                            <input
                              placeholder="Qualification Name"
                              className="app__input_standard"
                              {...register(`qualifications.${index}.name`, {
                                required: true
                              })}
                            />
                            <input
                              placeholder="Description"
                              className="app__input_standard"
                              {...register(
                                `qualifications.${index}.description`,
                                {
                                  required: true
                                }
                              )}
                            />
                            {fields.length > 1 && (
                              <button
                                type="button"
                                className="app__btn_red_xs"
                                onClick={() => remove(index)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="mt-1">
                            <label className="flex items-center justify-start space-x-1">
                              <input
                                type="checkbox"
                                {...register(
                                  `qualifications.${index}.required`
                                )}
                              />
                              <span className="text-gray-600">Required</span>
                            </label>
                          </div>
                          {errors.qualifications?.[index]?.name && (
                            <div className="app__error_message">
                              Qualification Name is required
                            </div>
                          )}
                          {errors.qualifications?.[index]?.description && (
                            <div className="app__error_message">
                              Description is required
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="app__btn_blue_xs"
                      onClick={handleAddQualification}
                    >
                      Add Qualification
                    </button>

                    {editData && (
                      <div className="app__warning_text !mx-0">
                        <span className="font-bold">Warning:</span> Deleting a
                        qualification standard will also permanently remove all
                        documents uploaded by applicants for this position on
                        Rankings.
                      </div>
                    )}
                  </div>
                </div>
                {/* End Seocond Column */}
              </div>

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
                      By checking this box, you acknowledge that all information
                      is accurate and up-to-date.
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
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEditModal
