import { ConfirmModal, CustomButton } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { runListQuery, type QueryError } from '@/utils/query-result'
import { useSupabase } from '@/context/SupabaseProvider'
import { RankingCriteriaTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

const RankingCriterias = ({ hideModal, rankingId }: ModalProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [list, setList] = useState<RankingCriteriaTypes[] | []>([])
  const [loadError, setLoadError] = useState<QueryError | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [selectedId, setSelectedId] = useState('')

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const {
    register,
    formState: { errors },
    reset,
    setError,
    clearErrors,
    handleSubmit
  } = useForm<RankingCriteriaTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: RankingCriteriaTypes) => {
    if (saving) return

    if (Number(formdata.points) + totalPoints > 100) {
      setError('points', {
        type: 'manual',
        message: 'Total points cannot exceed 100!'
      })
      return
    }

    clearErrors('points')

    setSaving(true)

    const newData = {
      name: formdata.name,
      points: formdata.points,
      type: formdata.type,
      potential: formdata.potential,
      ranking_id: rankingId
    }

    try {
      const { data, error } = await supabase
        .from('hrm_ranking_criterias')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Ranking Criteria',
          'hrm_ranking_criterias',
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
        id: data[0].id
      }
      setList([updatedData, ...list])

      setSaving(false)

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirmed = async () => {
    try {
      const { error } = await supabase
        .from('hrm_ranking_criterias')
        .delete()
        .eq('id', selectedId)

      if (error) {
        void logError(
          'Delete Ranking Criteria',
          'hrm_ranking_criterias',
          '',
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      const updatedList = list.filter((i) => i.id !== selectedId)
      setList(updatedList)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')
    } catch (e) {
      console.error(e)
    }

    setShowDeleteModal(false)
  }

  // useEffect to calculate total points when the list changes
  useEffect(() => {
    let total = 0 // Initialize total as 0

    list.forEach((item) => {
      const points = Number(item.points) // Convert points to number
      total += isNaN(points) ? 0 : points // Add points if valid, otherwise add 0
    })

    setTotalPoints(total)
  }, [list])

  useEffect(() => {
    const fetchData = async () => {
      const result = await runListQuery<RankingCriteriaTypes>(
        {
          transaction: 'Fetch ranking criterias',
          table: 'hrm_ranking_criterias',
          payload: { rankingId }
        },
        supabase
          .from('hrm_ranking_criterias')
          .select()
          .eq('ranking_id', rankingId)
      )

      // An empty criteria list means the ranking cannot be scored at all, so
      // it must not be indistinguishable from a failed lookup.
      if (!result.ok) {
        setLoadError(result.error)
        return
      }

      setLoadError(null)
      setList(result.data)
    }

    void fetchData()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Ranking Criterias</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              {loadError && (
                <div className="mb-3 border border-red-300 bg-red-50 px-3 py-2">
                  <div className="text-sm text-red-700">
                    {loadError.message} The criterias below are incomplete.
                  </div>
                </div>
              )}
              <div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="app__form_field_container">
                    <div className="w-full md:w-1/2">
                      <div className="app__label_standard">Criteria Name:</div>
                      <input
                        {...register('name', { required: true })}
                        placeholder="Criteria Name"
                        className="app__input_standard"
                      />
                      {errors.name && (
                        <div className="app__error_message">
                          Name is required
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full md:w-1/2">
                      <div className="app__label_standard">Points:</div>
                      <input
                        {...register('points', {
                          required: 'Points is required',
                          min: {
                            value: 1,
                            message: 'Must be at least 1',
                          },
                        })}
                        type="number"
                        min={1}
                        placeholder="Points"
                        className="app__input_standard"
                      />
                      {errors.points && (
                        <div className="app__error_message">
                          {errors.points.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="app__form_field_container">
                    <div className="w-full md:w-1/2">
                      <div className="app__label_standard">Type:</div>
                      <div className="flex items-center justify-start space-x-2 text-sm">
                        <label className="space-x-2">
                          <input
                            type="radio"
                            value="Discretionary"
                            {...register('type', { required: true })}
                          />
                          <span>Discretionary</span>
                        </label>

                        <label className="space-x-2">
                          <input
                            type="radio"
                            value="Criteria-based Rating"
                            {...register('type', { required: true })}
                          />
                          <span>Criteria-based Rating</span>
                        </label>
                      </div>
                      {errors.type && (
                        <div className="app__error_message">
                          Type of applicant is required
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full md:w-1/2">
                      <div className="app__label_standard">Potential:</div>
                      <div className="flex items-center justify-start space-x-2 text-sm">
                        <label className="space-x-2">
                          <input
                            type="radio"
                            value="Yes"
                            {...register('potential', { required: true })}
                          />
                          <span>Yes</span>
                        </label>

                        <label className="space-x-2">
                          <input
                            type="radio"
                            value="No"
                            {...register('potential', { required: true })}
                          />
                          <span>No</span>
                        </label>
                      </div>
                      {errors.potential && (
                        <div className="app__error_message">
                          This is required
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <button type="submit" className="app__btn_green_sm">
                      {saving ? 'Saving..' : 'Add Criteria'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="text-right">
                <span className="text-gray-700 text-sm">Total Points:</span>{' '}
                <span className="text-gray-700 font-bold">{totalPoints}</span>
              </div>
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">Criteria</th>
                    <th className="app__th">Points</th>
                    <th className="app__th"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.length > 0 &&
                    list.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <th className="app__th_firstcol">
                          <div className="font-medium flex space-x-2">
                            <span>{item.name}</span>
                            <span>({item.type})</span>
                            <span>({item.potential})</span>
                          </div>
                        </th>
                        <td className="app__td">{item.points}</td>
                        <td className="app__td">
                          <CustomButton
                            containerStyles="app__btn_red_xs"
                            title="Remove"
                            btnType="button"
                            handleClick={() => handleDelete(item.id)}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmModal
          header="Confirm Delete"
          btnText="Confirm"
          message="This action cannot be undone. Are you sure you want to remove this Criteria?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}

export default RankingCriterias
