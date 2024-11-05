import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes, RankingEvaluatorTypes } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ModalProps {
  hideModal: () => void
  applicantData: ApplicantTypes
  refetch: () => void
}

interface QualificationTypes {
  qualification_name: string
  qualification_description: string
  documents: Array<{
    id: string
    status: string
    document_url: string
    created_at: string
  }>
}

const ApplicantDetails = ({
  hideModal,
  applicantData,
  refetch
}: ModalProps) => {
  const [qualification, setQualification] = useState<QualificationTypes[] | []>(
    []
  )
  const [previousQualification, setPreviousQualification] = useState<
    QualificationTypes[] | []
  >([])
  const [refresh, setRefresh] = useState(false)
  const [evaluators, setEvaluators] = useState<RankingEvaluatorTypes[] | []>([])
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

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
        .select('*, qualification:qualification_id(*)')
        .eq('applicant_id', applicantData.id)

      if (data) {
        const groupedDocuments = data.reduce((acc: any, document: any) => {
          const { qualification_id, qualification } = document

          if (!acc[qualification_id]) {
            acc[qualification_id] = {
              qualification_name: qualification.name,
              qualification_description: qualification.description,
              documents: []
            }
          }

          acc[qualification_id].documents.push(document)
          return acc
        }, {})

        setQualification(groupedDocuments)
      }
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
    void fetchEvaluators()

    if (applicantData.previous_applicant === 'Yes') {
      void fetchPreviousQualificationsData()
    }
  }, [applicantData, refresh])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
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
                <div className="uppercase">
                  lastname: {applicantData.lastname}
                </div>
                <div className="uppercase">
                  firstname: {applicantData.firstname}
                </div>
                <div className="uppercase">
                  middlename: {applicantData.middlename}
                </div>
                <div className="uppercase">email: {applicantData.email}</div>
                <div className="uppercase">
                  address: {applicantData.address}
                </div>
                <div className="uppercase">age: {applicantData.age}</div>
                <div className="uppercase">sex: {applicantData.sex}</div>
                <div className="uppercase">
                  civil_status: {applicantData.civil_status}
                </div>
                <div className="uppercase">
                  religion: {applicantData.religion}
                </div>
                <div className="uppercase">
                  disability: {applicantData.disability}
                </div>
                <div className="uppercase">
                  ethnicity: {applicantData.ethnicity}
                </div>
                <div className="uppercase">
                  ethnicity detail: {applicantData.ethnicity_detail}
                </div>
                <div className="uppercase">
                  solo parent: {applicantData.solo_parent}
                </div>
                <div className="uppercase">
                  solo parent detail: {applicantData.solo_parent_detail}
                </div>
                <div className="uppercase">
                  contact no: {applicantData.contact_number}
                </div>
                <div className="uppercase">
                  specific major: {applicantData.specific_major}
                </div>
                <div className="uppercase">code: {applicantData.code}</div>
              </div>
              <div className="p-4 bg-gray-50 border space-y-6">
                <div className="text-center text-sm">
                  RECENT QUALIFICATION STANDARDS
                </div>
                <div>
                  <div className="p-4 bg-gray-50 border space-y-6">
                    {Object.entries(qualification).length === 0 && (
                      <div className="text-gray-600">No QS Uploaded</div>
                    )}
                    {Object.entries(qualification).map(
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
                                      <div className="flex-1">
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
                                      <div>
                                        {evaluators.some(
                                          (evaluator) =>
                                            evaluator.user_id ===
                                            session.user.id
                                        ) && (
                                          <div className="space-x-2">
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
                              No documents available.
                            </p>
                          )}
                        </div>
                      )
                    )}
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
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ApplicantDetails
