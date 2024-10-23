import { CustomButton } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ModalProps {
  hideModal: () => void
  applicantId: string
}

interface ExistingQualificationTypes {
  qualification_name: string
  documents: Array<{
    id: string
    document_url: string
  }>
}

const ApplicantQualifications = ({ hideModal, applicantId }: ModalProps) => {
  const [qualification, setQualification] = useState<
    ExistingQualificationTypes[] | []
  >([])
  const { supabase } = useSupabase()

  const extractFilename = (url: string) => {
    return url.split('/').pop() // Get the last part of the URL which is the filename
  }

  useEffect(() => {
    const fetchQualificationsData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_applicant_documents')
        .select('*, qualification:qualification_id(*)')
        .eq('applicant_id', applicantId)
      console.log(data)
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

    void fetchQualificationsData()
  }, [])

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
                              const filename = extractFilename(doc.document_url)

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
          </div>
        </div>
      </div>
    </>
  )
}

export default ApplicantQualifications
