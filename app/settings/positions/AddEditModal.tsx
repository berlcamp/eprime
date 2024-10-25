import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

// Types
import type { PositionTypes } from '@/types'

// Redux imports
import { CustomButton } from '@/components'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { logError } from '@/utils/fetchApi'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: PositionTypes | null
  refetch: () => void
}

const AddEditModal = ({ hideModal, editData, refetch }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    control,
    handleSubmit
  } = useForm<PositionTypes>({
    mode: 'onSubmit',
    defaultValues: {
      qualifications: [{ name: '', description: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'qualifications'
  })

  const onSubmit = async (formdata: PositionTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: PositionTypes) => {
    const newData = {
      name: formdata.name,
      type: formdata.type,
      salary_grade: formdata.salary_grade,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    try {
      const { data, error } = await supabase
        .from('hrm_positions')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create positions',
          'hrm_positions',
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
          return supabase.from('hrm_position_qualifications').insert({
            position_id: data[0].id,
            name: qualification.name,
            description: qualification.description
          })
        }
      )

      await Promise.all(insertPromises)

      // Append new data in redux
      const updatedData = { ...newData, id: data[0].id }
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

      // refetch the data of positions in order to update the qualifications list
      refetch()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: PositionTypes) => {
    if (!editData) return

    const newData = {
      name: formdata.name,
      type: formdata.type,
      salary_grade: formdata.salary_grade
    }

    try {
      const { error } = await supabase
        .from('hrm_positions')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update positions',
          'hrm_positions',
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
        .from('hrm_position_qualifications')
        .select('id')
        .eq('position_id', editData.id)

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
          .from('hrm_position_qualifications')
          .update({
            name: qual.name,
            description: qual.description
          })
          .eq('id', qual.id)

        if (updateQualError) {
          throw updateQualError
        }
      }

      // Insert new qualifications
      if (qualificationsToInsert.length > 0) {
        const newQualifications = qualificationsToInsert.map((qual) => ({
          position_id: editData.id,
          name: qual.name,
          description: qual.description
        }))

        const { error: insertError } = await supabase
          .from('hrm_position_qualifications')
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
          .from('hrm_position_qualifications')
          .delete()
          .in('id', qualificationsToDelete) // Remove them from the database

        if (deleteError) {
          throw deleteError
        }
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: editData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // refetch the data of positions in order to update the qualifications list
      refetch()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddQualification = () => {
    append({ name: '', description: '' }) // Add a blank qualification
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : '',
      type: editData ? editData.type : '',
      salary_grade: editData ? editData.salary_grade : '',
      qualifications: editData
        ? editData.qualifications.map((qual) => ({
            id: qual.id, // Preserve the qualification id
            name: qual.name,
            description: qual.description
          }))
        : [{ name: '', description: '' }]
    })
  }, [editData, reset])

  const salaryGradeOptions = []
  for (let i = 1; i <= 33; i++) {
    salaryGradeOptions.push(
      <option key={i} value={i}>
        {i}
      </option>
    )
  }

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Position Details</h5>
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
                      <div className="app__label_standard">Position Name:</div>
                      <div>
                        <input
                          {...register('name', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.name && (
                          <div className="app__error_message">
                            Position Name is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Type:</div>
                      <div>
                        <select
                          {...register('type', { required: true })}
                          className="app__input_standard"
                        >
                          <option value="">Choose Type</option>
                          <option value="Teaching">Teaching</option>
                          <option value="Non-teaching">Non-teaching</option>
                        </select>
                        {errors.type && (
                          <div className="app__error_message">
                            Type is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Salary Grade:</div>
                      <div>
                        <select
                          {...register('salary_grade', { required: true })}
                          className="app__input_standard"
                        >
                          {salaryGradeOptions}
                        </select>
                        {errors.salary_grade && (
                          <div className="app__error_message">
                            Salary Grade is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* End First Column */}
                {/* Begin Second Column */}
                <div className="w-full px-4">
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    Qualification Standards
                  </div>

                  {fields.map((_q, index) => (
                    <div key={index} className="app__form_field_container">
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
                          {...register(`qualifications.${index}.description`, {
                            required: true
                          })}
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
                  ))}

                  <button
                    type="button"
                    className="app__btn_blue_xs"
                    onClick={handleAddQualification}
                  >
                    Add Qualification
                  </button>
                  <div className="app__warning_text !mx-0">
                    <span className="font-bold">Warning:</span> Deleting a
                    qualification standard will also permanently remove all
                    documents uploaded by applicants for this position on
                    Rankings.
                  </div>
                </div>
                {/* End Second Column */}
              </div>
              <div className="app__modal_footer">
                <button type="submit" className="app__btn_green_sm">
                  {saving ? 'Saving...' : 'Save'}
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
