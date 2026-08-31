import {
  ConfirmModal,
  CustomButton,
  SearchUserInput,
  UserBlock
} from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { runListQuery, type QueryError } from '@/utils/query-result'
import { useSupabase } from '@/context/SupabaseProvider'
import { Employee, RankingEvaluatorTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

const RankingEvaluators = ({ hideModal, rankingId }: ModalProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clearMemberInput, setClearMemberInput] = useState(false)
  const [list, setList] = useState<RankingEvaluatorTypes[] | []>([])
  const [loadError, setLoadError] = useState<QueryError | null>(null)
  // Bumped after an evaluator is added or removed. The effect below used to
  // depend on `list` while also assigning it a freshly fetched array, so it
  // refetched on every render for as long as the modal was open.
  const [refresh, setRefresh] = useState(false)

  const [user, setUser] = useState<Employee | null>(null)

  const [selectedId, setSelectedId] = useState('')

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const {
    formState: { errors },
    reset,
    setError,
    setValue,
    clearErrors,
    handleSubmit
  } = useForm<RankingEvaluatorTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async () => {
    if (saving) return

    if (!user) {
      setError('user_id', {
        type: 'manual',
        message: 'Member is required'
      })
      return
    }

    clearErrors('user_id')

    setClearMemberInput(true)

    setSaving(true)

    const newData = {
      user_id: user.id,
      ranking_id: rankingId
    }

    try {
      const { data, error } = await supabase
        .from('hrm_ranking_evaluators')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Ranking Evaluator',
          'hrm_ranking_evaluators',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // insert to notifications
      await supabase.from('hrm_notifications').insert({
        message: 'You are added as Evaluator in a ranking.',
        url: '/ranking',
        type: 'ranking',
        user_id: user.id,
        ranking_evaluator_id: data[0].id,
        reference_table: 'hrm_ranking_evaluators'
      })

      const updatedData = {
        ...newData,
        hrm_user: user,
        id: data[0].id
      }
      setList([updatedData, ...list])
      setRefresh((prev) => !prev)

      setSaving(false)

      // reset all form fields
      reset()
      setUser(null)
      setClearMemberInput(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      // Make sure the member is not yet added
      const findUser = list.find((item) => item.user_id === selectedUsers[0].id)
      if (findUser) {
        setError('user_id', {
          type: 'manual',
          message: 'Member already added'
        })
        return
      }

      setUser(selectedUsers[0])
      setValue('user_id', selectedUsers[0].id)
      clearErrors('user_id')
    } else {
      setUser(null)
      setValue('user_id', '')
    }
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirmed = async () => {
    try {
      const { error } = await supabase
        .from('hrm_ranking_evaluators')
        .delete()
        .eq('id', selectedId)

      if (error) {
        void logError(
          'Delete Ranking Evaluator',
          'hrm_ranking_evaluators',
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
      setRefresh((prev) => !prev)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')
    } catch (e) {
      console.error(e)
    }

    setShowDeleteModal(false)
  }

  useEffect(() => {
    const fetchEvaluators = async () => {
      const result = await runListQuery<RankingEvaluatorTypes>(
        {
          transaction: 'Fetch ranking evaluators',
          table: 'hrm_ranking_evaluators',
          payload: { rankingId }
        },
        supabase
          .from('hrm_ranking_evaluators')
          .select(
            '*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url)'
          )
          .eq('ranking_id', rankingId)
      )

      if (!result.ok) {
        setLoadError(result.error)
        return
      }

      setLoadError(null)
      setList(result.data)
    }

    void fetchEvaluators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, rankingId])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Ranking Evaluators</h5>
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
                    {loadError.message} The evaluators below are incomplete.
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="app__form_field_container">
                  <div className="w-full md:w-1/2">
                    <div className="app__label_standard">Evaluator Name:</div>
                    <SearchUserInput
                      isMultiple={false}
                      clear={clearMemberInput}
                      handleSelectedUsers={handleSelectedUsers}
                    />
                    {errors.user_id && (
                      <div className="app__error_message">
                        {errors.user_id.message}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <button type="submit" className="app__btn_green_sm">
                    {saving ? 'Saving..' : 'Add'}
                  </button>
                </div>
              </form>

              {list.length === 0 && (
                <div className="mt-10 py-4">No evaluators added yet.</div>
              )}
              {list.length > 0 && (
                <table className="app__table mt-10">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">Evaluator</th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length > 0 &&
                      list.map((item, index) => (
                        <tr key={index} className="app__tr">
                          <th className="app__th_firstcol">
                            <UserBlock user={item.hrm_user} />
                          </th>
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
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmModal
          header="Confirm Delete"
          btnText="Confirm"
          message="This action cannot be undone. Are you sure you want to remove this evaluator?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}

export default RankingEvaluators
