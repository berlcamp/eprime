import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  ApplicantIerTypes,
  ApplicantTypes,
  RankingCommitteeCriteriaTypes,
  RankingCriteriaPoints
} from '@/types'
import { logError } from '@/utils/fetchApi'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { ChevronRightIcon } from 'lucide-react'
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
  lense: boolean
  max_points: number
}

interface EirData {
  id: number
  applicant_id: number
  qualification_id: number
  created_at: string
  remarks: string
  time: string
}

interface QualificationEntry {
  qualification: string
  eir_data: EirData[]
}

const CastPoints = ({
  hideModal,
  refetch,
  applicantData,
  criterias
}: ModalProps) => {
  const [saving, setSaving] = useState(false)
  const [ierData, setIerData] = useState<QualificationEntry[] | []>([])
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
        lense: c.criteria.type === 'Criteria-based Rating',
        points: findPoint ? findPoint.points : ''
      })
      setCriteriasField(fields)
    })
  }, [criterias])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('hrm_ranking_applicant_ier')
        .select('*, qualification:qualification_id(name)')
        .eq('applicant_id', applicantData.id)

      const groupedData: QualificationEntry[] = Object.values(
        data.reduce((acc: any, item: ApplicantIerTypes) => {
          const qualificationName = item.qualification.name

          if (!acc[qualificationName]) {
            acc[qualificationName] = {
              qualification: qualificationName,
              eir_data: []
            }
          }

          const { qualification, ...eirItem } = item // Remove 'qualification' key
          acc[qualificationName].eir_data.push(eirItem)

          return acc
        }, {})
      )
      setIerData(groupedData)
    })()
  }, [])

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
                        <div className="flex space-x-2">
                          <span>{criteria.name}</span>{' '}
                          {criteria.lense && (
                            <MagnifyingGlassIcon className="w-5 h-5" />
                          )}
                          <span className="font-light italic">
                            (Max: {criteria.max_points})
                          </span>
                        </div>
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
              {/* IER Data */}
              {ierData.length > 0 && (
                <div className="mt-8">
                  <div className="p-2 bg-gray-100 text-sm text-gray-600 space-y-4">
                    <div className="text-center text-sm text-gray-600">
                      IER Data
                    </div>
                    {ierData.map((ier, idx) => (
                      <div key={idx}>
                        <div className="text-xs">
                          {idx + 1}. {ier.qualification}
                        </div>
                        {ier.eir_data?.map((ierData, idx2) => (
                          <div className="pl-10 text-xs" key={idx2}>
                            <div className="flex items-center">
                              <ChevronRightIcon className="h-4 w-4" />
                              <div>
                                {ierData.remarks} ({ierData.time})
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default CastPoints
