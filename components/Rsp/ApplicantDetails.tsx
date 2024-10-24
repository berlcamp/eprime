import { CustomButton } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes } from '@/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ModalProps {
  hideModal: () => void
  applicantData: ApplicantTypes
}

interface QualificationTypes {
  qualification_name: string
  documents: Array<{
    id: string
    document_url: string
  }>
}

const ApplicantDetails = ({ hideModal, applicantData }: ModalProps) => {
  const [qualification, setQualification] = useState<QualificationTypes[] | []>(
    []
  )
  const [previousQualification, setPreviousQualification] = useState<
    QualificationTypes[] | []
  >([])
  const { supabase } = useSupabase()

  console.log('applicantData', applicantData)
  const extractFilename = (url: string) => {
    return url.split('/').pop() // Get the last part of the URL which is the filename
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
                qualification_name: qualification.name,
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

    void fetchQualificationsData()

    if (applicantData.previous_applicant === 'Yes') {
      void fetchPreviousQualificationsData()
    }
  }, [applicantData])

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
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              <div className="p-4 bg-gray-50 border space-y-6">
                <div className="text-center text-sm">
                  RECENT QUALIFICATION STANDARDS
                </div>
                <div>
                  <div className="p-4 bg-gray-50 border space-y-6">
                    {Object.entries(qualification).map(
                      (
                        [qualificationId, { qualification_name, documents }],
                        index
                      ) => (
                        <div key={qualificationId} className="mb-4">
                          <h3 className="text-gray-700 text-sm font-bold">
                            {index + 1}. {qualification_name}
                          </h3>
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
                              { qualification_name, documents }
                            ],
                            index
                          ) => (
                            <div key={qualificationId} className="mb-4">
                              <h3 className="text-gray-700 text-sm font-bold">
                                {index + 1}. {qualification_name}
                              </h3>
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
