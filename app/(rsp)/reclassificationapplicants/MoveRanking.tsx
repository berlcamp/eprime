import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { ReclassificationApplicantTypes, ReclassificationTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  applicantData: ReclassificationApplicantTypes
}

interface MoveFormTypes {
  ranking_id: string
  confirmed: string
}

const MoveRanking = ({ hideModal, applicantData }: ModalProps) => {
  const [saving, setSaving] = useState(false)

  const [rankings, setRankings] = useState<ReclassificationTypes[] | []>([])
  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)

  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<MoveFormTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: MoveFormTypes) => {
    if (saving) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('hrm_reclassification_applicants')
        .update({
          ranking_id: formdata.ranking_id
        })
        .eq('id', applicantData.id)

      if (error) {
        void logError(
          'Move Ranking',
          'hrm_reclassification_applicants',
          '',
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const hrmRanking = rankings.find(
        (r) => r.id.toString() === formdata.ranking_id
      )
      const items = [...globallist]
      const updatedData = {
        ranking: hrmRanking,
        id: applicantData.id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      setSaving(false)

      setToast('success', 'Successfully moved.')

      // reset all form fields
      reset()
      hideModal()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const fetchRankings = async () => {
      const { data } = await supabase
        .from('hrm_reclassifications')
        .select('*,position:position_id(name)')
        .eq('status', 'Open')
        .neq('id', applicantData.reclassification_id)
      if (data) {
        setRankings(data)
      }
    }

    void fetchRankings()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Move to another Ranking
              </h5>
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
                  <div className="w-full">
                    <div className="app__label_standard">
                      Move to Reclassification Ranking
                    </div>
                    <select
                      {...register('ranking_id', { required: true })}
                      className="app__select_standard"
                    >
                      <option value="">Choose</option>
                      {rankings.length > 0 &&
                        rankings.map((ranking) => (
                          <option key={ranking.id} value={ranking.id}>
                            {ranking.position.name}
                          </option>
                        ))}
                    </select>
                    {errors.ranking_id && (
                      <div className="app__error_message">This is required</div>
                    )}
                  </div>
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
                        By checking this box, you acknowledge that all
                        information is accurate.
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
                    {saving ? 'Saving..' : 'Move'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MoveRanking
