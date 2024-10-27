import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  ApplicantTypes,
  RankingCommitteeCriteriaTypes,
  RankingCriteriaPoints
} from '@/types'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface ModalProps {
  hideModal: () => void
  refetch: () => void
  applicantData: ApplicantTypes
  committeeId: string
  criterias: RankingCommitteeCriteriaTypes[]
}

interface CriteriaFieldsType {
  name: string
  commmittee_criteria_id: string
  points: string
  max_points: number
}
const CastPoints = ({
  hideModal,
  refetch,
  applicantData,
  criterias
}: ModalProps) => {
  const [saving, setSaving] = useState(false)
  const [criteriasField, setCriteriasField] = useState<CriteriaFieldsType[]>([])

  const { setToast } = useFilter()
  const { supabase } = useSupabase()

  const {
    register,
    formState: { errors },
    handleSubmit
  } = useForm<RankingCriteriaPoints>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: RankingCriteriaPoints) => {
    setSaving(true)

    const upsertData: any = []
    formdata.cast.forEach((c) =>
      upsertData.push({
        committee_criteria_id: Number(c.commmittee_criteria_id),
        applicant_id: applicantData.id,
        points: c.points
      })
    )

    try {
      const { error } = await supabase
        .from('hrm_ranking_applicant_points')
        .upsert(upsertData, {
          onConflict: ['committee_criteria_id', 'applicant_id'] // Define conflict columns
        })

      if (error) {
        void logError(
          'Cast points',
          'hrm_ranking_applicant_points',
          JSON.stringify(upsertData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const fields: CriteriaFieldsType[] = []
    criterias.forEach((c) => {
      const findPoint = c.criteria_points.find(
        (p) => p.applicant_id.toString() === applicantData.id.toString()
      )

      fields.push({
        name: c.criteria.name,
        commmittee_criteria_id: c.id,
        max_points: Number(c.criteria.points),
        points: findPoint ? findPoint.points : ''
      })
      setCriteriasField(fields)
    })
  }, [criterias])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Cast Points</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div>
                {criteriasField.map((criteria, idx) => (
                  <div key={idx} className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        <span>{criteria.name}</span>{' '}
                        <span className="font-light italic">
                          (Max: {criteria.max_points})
                        </span>
                      </div>
                      <div>
                        <input
                          type="hidden"
                          {...register(`cast.${idx}.commmittee_criteria_id`)}
                          value={criteria.commmittee_criteria_id}
                          className="app__input_standard"
                        />
                        <input
                          type="number"
                          step="any"
                          defaultValue={criteria.points}
                          placeholder="Points"
                          {...register(`cast.${idx}.points`, {
                            required: 'Points are required',
                            max: {
                              value: criteria.max_points,
                              message: `Points cannot exceed ${criteria.max_points}`
                            }
                          })}
                          className="app__input_standard"
                        />
                        {errors.cast?.[idx]?.points?.message && (
                          <div className="app__error_message">
                            {errors.cast?.[idx]?.points?.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? 'Saving...' : 'Save'}
                  containerStyles="app__btn_green"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default CastPoints
