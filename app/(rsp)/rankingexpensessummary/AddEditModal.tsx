import { CustomButton } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { useRankingOptions } from '@/hooks/useRankingOptions'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { RankingExpensesSummaryTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: RankingExpensesSummaryTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const { rankings, error: rankingsError } = useRankingOptions({
    status: 'Closed'
  })

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    watch,
    handleSubmit
  } = useForm<RankingExpensesSummaryTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: RankingExpensesSummaryTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: RankingExpensesSummaryTypes) => {
    const newData = {
      ranking_id: formdata.ranking_id,
      particulars: formdata.particulars,
      total_applicants: formdata.total_applicants,
      unit_cost: formdata.unit_cost,
      time_spent_per_applicant: formdata.time_spent_per_applicant,
      amount:
        Number(formdata.total_applicants) *
        Number(formdata.unit_cost) *
        Number(formdata.time_spent_per_applicant)
    }

    try {
      const { data, error } = await supabase
        .from('hrm_ranking_expenses_summary')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Ranking Expenses Summary',
          'hrm_ranking_expenses_summary',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      const updatedData = {
        ...newData,
        id: data[0].id,
        ranking: rankings.find((r) => r.id.toString() === formdata.ranking_id)
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

  const handleUpdate = async (formdata: RankingExpensesSummaryTypes) => {
    if (!editData) return

    const newData = {
      ranking_id: formdata.ranking_id,
      particulars: formdata.particulars,
      total_applicants: formdata.total_applicants,
      unit_cost: formdata.unit_cost,
      time_spent_per_applicant: formdata.time_spent_per_applicant,
      amount:
        Number(formdata.total_applicants) *
        Number(formdata.unit_cost) *
        Number(formdata.time_spent_per_applicant)
    }

    try {
      const { error } = await supabase
        .from('hrm_ranking_expenses_summary')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update Ranking Expenses Summary',
          'hrm_ranking_expenses_summary',
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
        id: editData.id,
        ranking: rankings.find(
          (r) => r.id.toString() === formdata.ranking_id.toString()
        )
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

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      ranking_id: editData ? editData.ranking_id : '',
      particulars: editData ? editData.particulars : '',
      total_applicants: editData ? editData.total_applicants : '',
      unit_cost: editData ? editData.unit_cost : '',
      time_spent_per_applicant: editData
        ? editData.time_spent_per_applicant
        : ''
    })
  }, [editData, reset, rankings])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Details</h5>
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
                  <div className="app__label_standard">Ranking</div>
                  <div>
                    <select
                      {...register('ranking_id', { required: true })}
                      className="app__select_standard"
                    >
                      {rankings.length === 0 && (
                        <option value="">No Closed Rankings Yet</option>
                      )}
                      {rankingsError && (
                        <option value="">{rankingsError.message}</option>
                      )}
                      {rankings.length > 0 && (
                        <option value="">Choose Ranking</option>
                      )}
                      {rankings.length > 0 &&
                        rankings.map((item, index) => (
                          <option key={index} value={item.id}>
                            {item.position?.name} - {item.type} - {item.year}
                          </option>
                        ))}
                    </select>
                    {errors.ranking_id && (
                      <div className="app__error_message">
                        Ranking is required
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {watch('ranking_id') !== '' && (
                <>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Particulars:</div>
                      <div>
                        <input
                          {...register('particulars', { required: true })}
                          className="app__input_standard"
                        />
                        {errors.particulars && (
                          <div className="app__error_message">
                            Particulas is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        No. of Applicants:
                      </div>
                      <div>
                        <input
                          {...register('total_applicants', {
                            min: {
                              value: 1,
                              message: 'Must be at least 1',
                            },
                          })}
                          type="number"
                          min={1}
                          step="1"
                          className="app__input_standard"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Unit Cost or Hourly Rate
                      </div>
                      <div>
                        <input
                          {...register('unit_cost', {
                            min: {
                              value: 0.01,
                              message: 'Must be greater than 0',
                            },
                          })}
                          type="number"
                          min={0.01}
                          step="any"
                          className="app__input_standard"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Time Spent (per applicant in hours)
                      </div>
                      <div>
                        <input
                          {...register('time_spent_per_applicant', {
                            min: {
                              value: 0.01,
                              message: 'Must be greater than 0',
                            },
                          })}
                          type="number"
                          min={0.01}
                          step="any"
                          className="app__input_standard"
                        />
                      </div>
                    </div>
                  </div>
                </>
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
