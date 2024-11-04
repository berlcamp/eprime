import { CustomButton, SearchUserInput } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchPositions, logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'

// Types
import type {
  Employee,
  PositionQualificationTypes,
  PositionTypes,
  RankingTypes
} from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useForm } from 'react-hook-form'
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

  const [qualifications, setQualifications] = useState<
    PositionQualificationTypes[] | []
  >([])

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
    setError,
    clearErrors,
    watch,
    handleSubmit
  } = useForm<RankingTypes>({
    mode: 'onSubmit',
    defaultValues: {
      chairman_id: ''
    }
  })

  const watchPositionId = watch('position_id')
  const watchedDisplay = watch('display_on_portal')

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
      status: formdata.status,
      display_on_portal: formdata.display_on_portal,
      display_on_portal_until: formdata.display_on_portal_until,
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
      const insertPromises = qualifications.map(async (qualification) => {
        return supabase.from('hrm_ranking_qualifications').insert({
          ranking_id: data[0].id,
          position_qualification_id: qualification.id,
          name: qualification.name,
          description: qualification.description
        })
      })

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
      status: formdata.status,
      display_on_portal: formdata.display_on_portal,
      display_on_portal_until: formdata.display_on_portal_until
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

      // upsert qualification standards
      const upsertData: any = []
      qualifications.forEach((qual) =>
        upsertData.push({
          ranking_id: editData.id,
          position_qualification_id: qual.id,
          name: qual.name,
          description: qual.description
        })
      )

      const { error: error2 } = await supabase
        .from('hrm_ranking_qualifications')
        .upsert(upsertData, {
          onConflict: ['ranking_id', 'position_qualification_id'] // Define conflict columns
        })

      if (error2) {
        void logError(
          'Upsert ranking qualifications standard',
          'hrm_ranking_qualifications',
          JSON.stringify(upsertData),
          error2.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error2.message)
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

  useEffect(() => {
    if (qualifications.length === 0) {
      setError('has_qualification_standard', {
        type: 'manual',
        message: 'Qualification standard is required'
      })
    } else {
      clearErrors('has_qualification_standard')
    }
  }, [qualifications])

  useEffect(() => {
    const fetchQualifications = async () => {
      const { data } = await supabase
        .from('hrm_position_qualifications')
        .select()
        .eq('position_id', watchPositionId)

      if (data) {
        setQualifications(data)
      }
    }
    void fetchQualifications()
  }, [watchPositionId])

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
      display_on_portal: editData ? editData.display_on_portal : '',
      display_on_portal_until: editData ? editData.display_on_portal_until : ''
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
              <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
                {/* Begin First Column */}
                <div className="w-full px-2">
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
                              <option value="CAR-RQA">CAR-RQA</option>
                              <option value="CAR">CAR</option>
                              <option value="Reclassification">
                                Reclassification
                              </option>
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
                              {editData.type}
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
                              Position can no longer be edited as there are
                              already applicants for this ranking.
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
                          <option value="Junior Highschool">
                            Junior Highschool
                          </option>
                          <option value="Senior Highschool">
                            Senior Highschool
                          </option>
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
                        Display on Job Postings?
                      </div>
                      <div>
                        <select
                          {...register('display_on_portal', { required: true })}
                          className="app__select_standard"
                        >
                          <option value="">Choose</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                        {errors.display_on_portal && (
                          <div className="app__error_message">
                            This is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {watchedDisplay === 'Yes' && (
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">
                          Display on Job Postings Until?
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
                  )}
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
                </div>
                {/* End First Column */}
                {/* Begin Second Column */}
                <div className="w-full px-8">
                  <div className="border p-4 bg-white">
                    <div className="text-sm font-semibold text-gray-700 mb-4">
                      Qualification Standards
                    </div>
                    {errors.has_qualification_standard && (
                      <div className="app__error_message">
                        No qualification standard added for this position yet.
                        Please tell system administration to add qualification
                        under Position Settings.
                      </div>
                    )}
                    {qualifications.length > 0 &&
                      qualifications.map((qual, index) => (
                        <div key={index} className="app__form_field_container">
                          <div className="flex space-x-2">
                            <div className="font-bold">
                              {index + 1}. {qual.name}
                            </div>
                            <div>{qual.description}</div>
                          </div>
                        </div>
                      ))}
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
