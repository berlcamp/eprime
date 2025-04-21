import {
  ConfirmModal,
  CustomButton,
  SearchUserInput,
  UserBlock
} from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Employee, RankingCommitteeTypes, RankingCriteriaTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

const RankingCommittees = ({ hideModal, rankingId }: ModalProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clearMemberInput, setClearMemberInput] = useState(false)
  const [list, setList] = useState<RankingCommitteeTypes[] | []>([])
  const [criterias, setCriterias] = useState<RankingCriteriaTypes[] | []>([])

  const [user, setUser] = useState<Employee | null>(null)

  const [selectedId, setSelectedId] = useState('')

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const {
    register,
    formState: { errors },
    reset,
    setError,
    setValue,
    clearErrors,
    handleSubmit
  } = useForm<RankingCommitteeTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: RankingCommitteeTypes) => {
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
      type: formdata.type,
      ranking_id: rankingId
    }

    try {
      const { data, error } = await supabase
        .from('hrm_ranking_committees')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Ranking Committee',
          'hrm_ranking_committees',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      if (formdata.criteria_ids && formdata.criteria_ids.length > 0) {
        const insertData = formdata.criteria_ids?.map((id) => ({
          committee_id: data[0].id,
          criteria_id: id
        }))

        // Insert the checked criterias into the Supabase table
        await supabase
          .from('hrm_ranking_committee_criterias')
          .insert(insertData)
      }

      // insert to notifications
      await supabase.from('hrm_notifications').insert({
        message: 'You are added as Committee Member in a ranking.',
        url: '/ranking',
        type: 'ranking',
        user_id: user.id,
        ranking_committee_id: data[0].id,
        reference_table: 'hrm_ranking_committees'
      })

      const updatedData = {
        ...newData,
        hrm_user: user,
        id: data[0].id
      }
      setList([updatedData, ...list])

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
        .from('hrm_ranking_committees')
        .delete()
        .eq('id', selectedId)

      if (error) {
        void logError(
          'Delete Ranking Committee',
          'hrm_ranking_committees',
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

  useEffect(() => {
    const fetchCriterias = async () => {
      const { data } = await supabase
        .from('hrm_ranking_criterias')
        .select('*, committees:hrm_ranking_committee_criterias(*)')
        .eq('ranking_id', rankingId)
      if (data) {
        setCriterias(data)
      }
    }

    const fetchCommittees = async () => {
      const { data } = await supabase
        .from('hrm_ranking_committees')
        .select(
          '*, hrm_user:user_id(id,firstname,lastname,avatar_url),committee_criterias:hrm_ranking_committee_criterias(*,criteria:criteria_id(*))'
        )
        .eq('ranking_id', rankingId)
      if (data) {
        setList(data)
      }
    }

    void fetchCommittees()
    void fetchCriterias()
  }, [list])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Ranking Committees</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="app__form_field_container">
                  <div className="w-full md:w-1/2">
                    <div className="app__label_standard">Member Name:</div>
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
                <div className="app__form_field_container">
                  <div className="w-full md:w-1/2">
                    <div className="app__label_standard">Type</div>
                    <select
                      {...register('type', { required: true })}
                      className="app__select_standard"
                    >
                      <option value="">Choose</option>
                      <option value="Original Member">Original Member</option>
                      <option value="Sub-committee">Sub-committee</option>
                      <option value="Secretariat">Secretariat</option>
                    </select>
                    {errors.type && (
                      <div className="app__error_message">Type is required</div>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  {criterias.length > 0 ? (
                    <>
                      <div className="app__label_standard">
                        This member can cast point to the following criteria/s:
                      </div>
                      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 bg-white p-2 border">
                        {criterias.map((item, index) => (
                          <label key={index} className="text-sm text-gray-700">
                            <input
                              type="checkbox"
                              value={item.id}
                              {...register('criteria_ids')}
                            />{' '}
                            {item.name} ({item.type})
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-700 bg-white p-2 border">
                      No criterias added yet. Go to ranking Manage Criteria
                      settings to and create criterias first.
                    </div>
                  )}
                </div>
                <div>
                  <button type="submit" className="app__btn_green_sm">
                    {saving ? 'Saving..' : 'Add Committee Member'}
                  </button>
                </div>
              </form>

              {list.length === 0 && (
                <div className="mt-10 py-4">
                  No committee members added yet.
                </div>
              )}
              {list.length > 0 && (
                <table className="app__table mt-10">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th w-96">Member</th>
                      <th className="app__th">Type</th>
                      <th className="app__th">Can cast points on Criteria</th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length > 0 &&
                      list.map((item, index) => (
                        <tr key={index} className="app__tr">
                          <th className="app__th_firstcol">
                            <div className="flex items-center space-x-2">
                              <UserBlock user={item.hrm_user} />
                              {item.type === 'Original Member' && (
                                <>
                                  {item.status === 'Pending Confirmation' ? (
                                    <span className="text-orange-600">
                                      ({item.status})
                                    </span>
                                  ) : (
                                    <span className="text-green-600">
                                      ({item.status})
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </th>
                          <td className="app__td">{item.type}</td>
                          <td className="app__td">
                            <div className="space-x-1 space-y-1">
                              {item.committee_criterias?.map((c) => (
                                <span
                                  key={c.id}
                                  className="inline-flex p-1 bg-green-100 border border-green-500"
                                >
                                  {c.criteria.name}
                                </span>
                              ))}
                            </div>
                          </td>
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
          message="This action cannot be undone. Are you sure you want to remove this member?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}

export default RankingCommittees
