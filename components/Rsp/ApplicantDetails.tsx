import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  ApplicantDocuments,
  ApplicantTypes,
  RankingEvaluatorTypes,
  RankingQualifications
} from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface ModalProps {
  hideModal: () => void
  applicantData: ApplicantTypes
  refetch: () => void
}

interface QualificationTypes {
  qualification_name: string
  qualification_description: string
  qualification_required: boolean
  documents: Array<{
    id: string
    status: string
    remarks: string
    document_url: string
    created_at: string
  }>
}

interface QualificationTypes {
  qualification_name: string
  qualification_description: string
  qualification_required: boolean
  documents: Array<{
    id: string
    status: string
    remarks: string
    document_url: string
    created_at: string
  }>
}

interface IerForm {
  education: string
  eligibility: string
  eligibility_rating: string
  experience: string
  experience_time: string
  training: string
  training_time: string
}

const ApplicantDetails = ({
  hideModal,
  applicantData,
  refetch
}: ModalProps) => {
  const [applicantQualifications, setApplicantQualifications] = useState<
    ApplicantDocuments[] | []
  >([])
  const [rankingQualifications, setRankingQualifications] = useState<
    RankingQualifications[] | []
  >([])

  const [previousQualification, setPreviousQualification] = useState<
    QualificationTypes[] | []
  >([])
  const [refresh, setRefresh] = useState(false)
  const [saving, setSaving] = useState(false)
  const [evaluators, setEvaluators] = useState<RankingEvaluatorTypes[] | []>([])
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const { register, handleSubmit } = useForm<IerForm>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: IerForm) => {
    setSaving(true)
    console.log('formdata', formdata)
    setSaving(false)
  }

  const extractFilename = (url: string) => {
    return url.split('/').pop() // Get the last part of the URL which is the filename
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('hrm_ranking_applicant_documents')
      .update({
        status
      })
      .eq('id', id)
    if (error) {
      setToast('error', 'Something went wrong, please reload the page')
    } else {
      setRefresh(!refresh)
    }
  }

  const handleClose = () => {
    hideModal()
    refetch()
  }

  useEffect(() => {
    const fetchQualificationsData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_applicant_documents')
        .select()
        .eq('applicant_id', applicantData.id)

      setApplicantQualifications(data)
    }

    const fetchRankingQualificationsData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_qualifications')
        .select()
        .eq('ranking_id', applicantData.ranking_id)

      setRankingQualifications(data)
    }

    const fetchPreviousQualificationsData = async () => {
      const { data: previousApplicantData } = await supabase
        .from('hrm_ranking_applicants')
        .select()
        .eq('code', applicantData.previous_applicant_code)
        .maybeSingle()

      // Get the previous qualification documents
      if (previousApplicantData) {
        const { data } = await supabase
          .from('hrm_ranking_applicant_documents')
          .select('*, qualification:qualification_id(*)')
          .eq('applicant_id', previousApplicantData.id)

        if (data) {
          const groupedDocuments = data.reduce((acc: any, document: any) => {
            const { qualification_id, qualification } = document

            if (!acc[qualification_id]) {
              acc[qualification_id] = {
                document_id: document.id,
                document_status: document.status,
                qualification_name: qualification.name,
                qualification_description: qualification.description,
                documents: []
              }
            }

            acc[qualification_id].documents.push(document)
            return acc
          }, {})

          setPreviousQualification(groupedDocuments)
        }
      }
    }

    const fetchEvaluators = async () => {
      const { data: evaluatorsData } = await supabase
        .from('hrm_ranking_evaluators')
        .select()
        .eq('ranking_id', applicantData.ranking_id)
      setEvaluators(evaluatorsData)
    }

    void fetchQualificationsData()
    void fetchRankingQualificationsData()

    void fetchEvaluators()

    if (applicantData.previous_applicant === 'Yes') {
      void fetchPreviousQualificationsData()
    }
  }, [applicantData, refresh])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Qualifications Standard
              </h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={handleClose}
              />
            </div>
            <div className="app__modal_body">
              <div className="p-4 text-sm text-gray-700 bg-gray-50 border space-y-2">
                <div className="grid gap-4">
                  <div>
                    <div className="app__label_standard">
                      Applicant Details:
                    </div>
                    <div className="app__label_value">
                      {applicantData.firstname} {applicantData.middlename}{' '}
                      {applicantData.lastname}
                    </div>
                    <div className="app__label_value">
                      <span className="font-light">
                        ({applicantData.email})
                      </span>
                    </div>
                    <div className="app__label_value">
                      <span className="font-light">
                        ({applicantData.contact_number})
                      </span>
                    </div>
                    <div className="app__label_value">
                      {applicantData.age} years old, {applicantData.sex} (
                      {applicantData.civil_status})
                    </div>
                    <div className="app__label_value">
                      {applicantData.address}
                    </div>
                  </div>
                  <div>
                    <div className="app__label_standard">Application Code:</div>
                    <div className="app__label_value">{applicantData.code}</div>
                  </div>
                  <div>
                    <div className="app__label_standard">Specific Major:</div>
                    <div className="app__label_value">
                      {applicantData.specific_major}
                    </div>
                  </div>
                  <div>
                    <div className="app__label_standard">Disability:</div>
                    <div className="app__label_value">
                      {applicantData.disability}
                    </div>
                  </div>
                  <div>
                    <div className="app__label_standard">Ethnicity:</div>
                    <div className="app__label_value">
                      {applicantData.ethnicity} {applicantData.ethnicity_detail}
                    </div>
                  </div>
                  <div>
                    <div className="app__label_standard">Latin Honor:</div>
                    <div className="app__label_value">
                      {applicantData.latin_honor}
                    </div>
                  </div>
                  <div>
                    <div className="app__label_standard">
                      Special Program Beneficiary:
                    </div>
                    <div className="app__label_value">
                      {applicantData.special_program_beneficiary}
                    </div>
                  </div>
                  <div>
                    <div className="app__label_standard">Special Skills:</div>
                    <div className="app__label_value">
                      {applicantData.special_skills}
                    </div>
                  </div>
                  <div>
                    <div className="app__label_standard">Solo Parent:</div>
                    <div className="app__label_value">
                      {applicantData.solo_parent}{' '}
                      {applicantData.solo_parent_detail}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 space-y-6">
                <div className="text-center text-sm">
                  RECENT QUALIFICATION STANDARDS
                </div>
                <div>
                  <div className="p-4 bg-gray-50 border space-y-6">
                    {rankingQualifications?.map((qualification, i) => (
                      <div key={i} className="mb-4">
                        <h3 className="text-gray-700 text-sm font-bold">
                          {i + 1}. {qualification.name}{' '}
                          {qualification.required && <span>(Required)</span>}
                        </h3>
                        <div className="text-xs text-gray-600 mb-2 pl-4">
                          {qualification.description}
                        </div>
                        {applicantQualifications?.filter(
                          (aq) =>
                            aq.qualification_id.toString() ===
                            qualification.id.toString()
                        ).length > 0 ? (
                          <ul>
                            {applicantQualifications
                              ?.filter(
                                (aq) =>
                                  aq.qualification_id.toString() ===
                                  qualification.id.toString()
                              )
                              .map((doc, index) => {
                                const filename = extractFilename(
                                  doc.document_url
                                )

                                return (
                                  <li key={index} className="mb-2">
                                    <div className="flex space-x-2">
                                      {/* Display the filename and make it downloadable */}
                                      <div>
                                        <Link
                                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${doc.document_url}`}
                                          download={filename}
                                          target="_blank"
                                          className="text-blue-600 hover:underline"
                                        >
                                          {filename}
                                        </Link>
                                        <div className="text-[10px] italic text-gray-600">
                                          Submitted on{' '}
                                          {format(
                                            new Date(doc.created_at),
                                            'MMM d, yyyy'
                                          )}
                                        </div>
                                      </div>

                                      <div>
                                        {doc.status === 'Okay' && (
                                          <span className="app__status_green">
                                            Okay
                                          </span>
                                        )}
                                        {doc.status === 'Not Okay' && (
                                          <span className="app__status_red">
                                            Not Okay
                                          </span>
                                        )}
                                        {doc.status === 'For Evaluation' && (
                                          <span className="app__status_orange">
                                            For Evaluation
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1">&nbsp;</div>
                                      <div>
                                        {evaluators.some(
                                          (evaluator) =>
                                            evaluator.user_id ===
                                            session.user.id
                                        ) && (
                                          <div className="flex space-x-2">
                                            <CustomButton
                                              containerStyles="app__btn_green_xs"
                                              title="Okay"
                                              btnType="button"
                                              handleClick={() =>
                                                handleUpdateStatus(
                                                  doc.id,
                                                  'Okay'
                                                )
                                              }
                                            />
                                            <CustomButton
                                              containerStyles="app__btn_red_xs"
                                              title="Not Okay"
                                              btnType="button"
                                              handleClick={() =>
                                                handleUpdateStatus(
                                                  doc.id,
                                                  'Not Okay'
                                                )
                                              }
                                            />
                                            <div>
                                              <RemarksInput
                                                docId={doc.id}
                                                remarks={doc.remarks}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                )
                              })}
                          </ul>
                        ) : (
                          <p className="text-gray-500">
                            No documents uploaded.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {applicantData.previous_applicant === 'Yes' &&
                Object.entries(previousQualification).length > 0 && (
                  <div className="p-4 bg-gray-50 border space-y-6 mt-6">
                    <div className="text-center text-sm">
                      PREVIOUSLY SUBMITTED QUALIFICATION STANDARDS
                    </div>
                    <div>
                      <div className="p-4 bg-gray-50 border space-y-6">
                        {Object.entries(previousQualification).map(
                          (
                            [
                              qualificationId,
                              {
                                qualification_name,
                                qualification_description,
                                documents
                              }
                            ],
                            index
                          ) => (
                            <div key={qualificationId} className="mb-4">
                              <h3 className="text-gray-700 text-sm font-bold">
                                {index + 1}. {qualification_name}
                              </h3>
                              <div className="text-xs text-gray-600 mb-2 pl-4">
                                {qualification_description}
                              </div>
                              {documents.length > 0 ? (
                                <ul>
                                  {documents.map((doc, index) => {
                                    const filename = extractFilename(
                                      doc.document_url
                                    )

                                    return (
                                      <li key={index} className="mb-2">
                                        {/* Display the filename and make it downloadable */}
                                        <Link
                                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${doc.document_url}`}
                                          download={filename}
                                          target="_blank"
                                          className="text-blue-600 hover:underline"
                                        >
                                          {filename}
                                        </Link>
                                      </li>
                                    )
                                  })}
                                </ul>
                              ) : (
                                <p className="text-gray-500">
                                  No documents available.
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              <div className="mt-8 text-center">IER Data</div>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="m-4 p-4 text-sm border grid grid-cols-2 gap-2 bg-gray-100"
              >
                <div>
                  <div className="app__label_standard">Education</div>
                  <div>
                    <textarea
                      placeholder="Remarks"
                      {...register('education')}
                      className="app__input_standard"
                    />
                  </div>
                </div>
                <div>
                  <div className="app__label_standard">Eligibility</div>
                  <div>
                    <textarea
                      placeholder="Remarks"
                      {...register('eligibility')}
                      className="app__input_standard"
                    />
                    <input
                      placeholder="Rating"
                      {...register('eligibility_rating')}
                      className="app__input_standard"
                    />
                  </div>
                </div>
                <div>
                  <div className="app__label_standard">Training</div>
                  <div>
                    <textarea
                      placeholder="Remarks"
                      {...register('training')}
                      className="app__input_standard"
                    />
                    <input
                      placeholder="Date/Time"
                      {...register('training_time')}
                      className="app__input_standard"
                    />
                  </div>
                </div>
                <div>
                  <div className="app__label_standard">Experience</div>
                  <div>
                    <textarea
                      placeholder="Remarks"
                      {...register('experience')}
                      className="app__input_standard"
                    />
                    <input
                      placeholder="Date/TIme"
                      {...register('experience_time')}
                      className="app__input_standard"
                    />
                  </div>
                </div>
                <div className="col-span-2">
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
      </div>
    </>
  )
}

const RemarksInput = ({
  docId,
  remarks
}: {
  docId: string
  remarks: string
}) => {
  const [inputValue, setInputValue] = useState(remarks)

  const { setToast } = useFilter()
  const { supabase } = useSupabase()

  const handleAddRemarks = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent default form submission behavior

      const { error } = await supabase
        .from('hrm_ranking_applicant_documents')
        .update({
          remarks: inputValue
        })
        .eq('id', docId)

      if (error) {
        setToast('error', 'Something went wrong, please reload the page.')
      } else {
        setToast('success', 'Remarks successfully saved.')
      }
    }
  }

  return (
    <input
      type="text"
      placeholder="Write remarks"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleAddRemarks}
      className="app__input_standard"
    />
  )
}

export default ApplicantDetails
