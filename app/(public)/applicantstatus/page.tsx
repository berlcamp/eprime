'use client'
import { ConfirmModal, TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantDocuments, ApplicantTypes } from '@/types'
import { generateReferenceCode } from '@/utils/text-helper'
import { format } from 'date-fns'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

const Page: React.FC = () => {
  const [saving, setSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedUrl, setSelectedUrl] = useState<string>('')
  const [isCodeFound, setIsCodeFound] = useState(true)
  const [documents, setDocuments] = useState<File[][]>([])

  const [applicantDetails, setApplicantDetails] =
    useState<ApplicantTypes | null>(null)

  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [inputValue, setInputValue] = useState(code ?? '')
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const {
    register,
    formState: { errors },
    setValue,
    handleSubmit
  } = useForm<ApplicantTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async () => {
    if (saving) return

    setSaving(true)

    void handleUpdate()
  }

  const handleUpdate = async () => {
    if (!applicantDetails) return

    try {
      // Upload documents

      // Create an array of promises
      const uploadPromises = applicantDetails.ranking.qualifications.map(
        async (qualification, index) => {
          // Create an array for the current qualification's file uploads
          if (documents[index]) {
            const fileUploadPromises = documents[index].map(async (file) => {
              const randomString = generateReferenceCode()

              // Extract the file extension (e.g., ".pdf", ".jpg")
              const fileExtension = file.name.split('.').pop()
              const newFileName = `${randomString}.${fileExtension}`

              const { data: fileData, error: uploadError } =
                await supabase.storage
                  .from('hrm_public')
                  .upload(
                    `applicant_documents/${applicantDetails.id}/${newFileName}`,
                    file
                  )

              // Check for upload errors
              if (uploadError) {
                console.error('Upload error:', uploadError)
                throw new Error(`Error uploading file: ${file.name}`)
              }

              // Insert the document URL into the database
              await supabase.from('hrm_ranking_applicant_documents').insert({
                applicant_id: applicantDetails.id,
                qualification_id: qualification.id,
                document_url: fileData?.path
              })
            })

            // Return the promise for the current qualification's file uploads
            return await Promise.all(fileUploadPromises)
          }
        }
      )

      // Await all qualifications upload promises
      try {
        await Promise.all(uploadPromises)
        console.log('All files uploaded successfully!')
      } catch (error) {
        console.error('Error during file upload:', error)
      }

      setIsSuccess(true)
      setSaving(false)
      void handleSearch()
    } catch (e) {
      console.error(e)
    }
  }

  const handleFileUpload = (index: number, files: FileList | null) => {
    if (!files) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ] // Images, PDF, DOCX

    const newDocuments = Array.from(files).filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `File type ${file.name} is not allowed. Please upload only images, DOCX, or PDF files.`
        )
        return false // Exclude invalid files
      }
      return true // Include valid files
    })

    if (newDocuments.length === 0) return // Stop if no valid files

    const updatedDocuments = [...documents]
    updatedDocuments[index] = newDocuments
    setDocuments(updatedDocuments)
    setValue(`documents.${index}`, updatedDocuments[index])
  }

  // Function to be called when the user types or pastes the 5th character
  const handleSearch = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('hrm_ranking_applicants')
      .select(
        '*, ranking:ranking_id(status,days_to_comply,type,year,position:position_id(name),qualifications:hrm_ranking_qualifications(*)),applicant_documents:hrm_ranking_applicant_documents(*, qualification:qualification_id(*))'
      )
      .eq('code', inputValue)
      .maybeSingle()

    if (data) {
      setIsCodeFound(true)
      setApplicantDetails(data)
    } else {
      setIsCodeFound(false)
      setApplicantDetails(null)
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent default form submission behavior
      void handleSearch()
    }
  }

  const isDateInPast = (rankingDate: string) => {
    // Check if the parsed date is valid
    if (!rankingDate) {
      return false // Treat invalid dates as not in the past
    }

    const rankingDateObject = new Date(rankingDate)

    const currentDate = new Date()
    return rankingDateObject < currentDate
  }

  const qualificationStatus = (statuses: ApplicantDocuments[]) => {
    if (statuses.length === 0) {
      return 'No Qualifications'
    }
    if (statuses.some((item) => item.status === 'Not Okay')) {
      return 'Not Qualified'
    } else if (statuses.some((item) => item.status === 'For Evaluation')) {
      return 'For Evaluation'
    } else if (statuses.every((item) => item.status === 'Okay')) {
      return 'Qualified'
    }
    return 'Not Known'
  }

  const handleDeleteConfirmed = async () => {
    try {
      const { error } = await supabase
        .from('hrm_ranking_applicant_documents')
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      // delete the files on supabase storage
      const { error: error2 } = await supabase.storage
        .from('hrm_public')
        .remove([selectedUrl])

      if (error2) {
        setToast('error', 'Something went wrong, please reload the page.')
        if (error) throw new Error(error.message)
      }

      // pop up the success message
      setToast('success', 'Successfully Deleted!')

      void handleSearch()
    } catch (e) {
      console.error(e)
    } finally {
      setShowDeleteModal(false)
    }

    setShowDeleteModal(false)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const extractFilename = (url: string) => {
    return url.split('/').pop() // Get the last part of the URL which is the filename
  }

  useEffect(() => {
    void handleSearch()
  }, [code])

  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="bg-gray-700 h-full pb-10 pt-32 px-6 flex items-start justify-center">
        <div className="bg-gray-100 p-4 mb-20 rounded-lg border w-full md:w-[720px]">
          <div className="px-4 text-lg text-center uppercase font-semibold text-gray-700">
            <span>Application Status</span>
          </div>
          {isSuccess && (
            <div className="text-green-700 font-medium my-4 mx-4 bg-green-100 border border-green-300 p-2">
              Successfully submitted.
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">
                  Enter your Application Code:
                </div>
                <div>
                  <input
                    placeholder="Code"
                    value={inputValue}
                    onChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    className="app__input_standard"
                  />
                </div>
              </div>
            </div>

            {applicantDetails &&
              applicantDetails.ranking.status === 'Closed' && (
                <div className="mb-8 app__error_message">
                  Ranking already closed for this application code
                </div>
              )}

            {applicantDetails && applicantDetails.ranking.status === 'Open' && (
              <div className="mb-8 text-sm">
                <div>
                  <span className="text-gray-600">Applicant: </span>
                  <span className="font-medium">
                    {applicantDetails.firstname} {applicantDetails.middlename}{' '}
                    {applicantDetails.lastname}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600">Application For: </span>
                  <span className="font-medium">
                    {applicantDetails.ranking?.position?.name} /
                    {applicantDetails.ranking?.type} /
                    {applicantDetails.ranking?.year}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600">Status: </span>
                  {qualificationStatus(applicantDetails.applicant_documents) ===
                    'For Evaluation' && (
                    <span className="text-orange-500 bg-orange-100 border border-orange-500 py-px px-1">
                      For Evaluation
                    </span>
                  )}
                  {qualificationStatus(applicantDetails.applicant_documents) ===
                    'Qualified' && (
                    <span className="text-green-500 bg-green-100 border border-green-500 py-px px-1">
                      Qualified
                    </span>
                  )}
                  {qualificationStatus(applicantDetails.applicant_documents) ===
                    'Not Qualified' && (
                    <span className="text-red-500 bg-red-100 border border-red-500 py-px px-1">
                      Not Qualified
                    </span>
                  )}
                  {qualificationStatus(applicantDetails.applicant_documents) ===
                    'No Qualifications' && (
                    <span className="text-red-500 bg-red-100 border border-red-500 py-px px-1">
                      No Qualifications
                    </span>
                  )}
                </div>
              </div>
            )}

            {loading && <TwoColTableLoading />}

            {!loading && !isCodeFound && (
              <div className="text-red-500 text-sm font-medium">
                No matching application for this code.
              </div>
            )}

            {!loading &&
              applicantDetails &&
              applicantDetails.ranking.status === 'Open' &&
              isDateInPast(applicantDetails.ranking.days_to_comply) && (
                <div className="text-red-500 text-sm font-medium">
                  The compliance due date has passed. Deadline:{' '}
                  {format(
                    new Date(applicantDetails.ranking.days_to_comply),
                    'MMM dd, yyyy'
                  )}
                </div>
              )}
            {!loading &&
              applicantDetails &&
              applicantDetails.ranking.status === 'Open' &&
              !isDateInPast(applicantDetails.ranking.days_to_comply) && (
                <div className="grid gap-4">
                  <div>
                    <div className="text-gray-600 text-sm mb-2">
                      Upload updated supporting documents for each Qualification
                      Standards below (If applicable):{' '}
                    </div>
                    <div className="p-4 bg-gray-50 border space-y-6">
                      <div className="text-center text-sm">
                        QUALIFICATION STANDARDS
                      </div>
                      {applicantDetails.ranking.qualifications.map(
                        (qualification, index) => (
                          <div key={qualification.id}>
                            <h3 className="text-gray-700 text-sm font-bold">
                              {index + 1}. {qualification.name}{' '}
                            </h3>
                            <div className="text-xs text-gray-600 pl-4">
                              {qualification.description}
                            </div>
                            <input
                              type="file"
                              multiple
                              onChange={(e) =>
                                handleFileUpload(index, e.target.files)
                              }
                              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-500"
                            />
                            <div className="pl-4">
                              {applicantDetails.applicant_documents.filter(
                                (applicantDoc) =>
                                  applicantDoc.qualification_id ===
                                  qualification.id
                              ).length > 0 ? (
                                <>
                                  <div className="text-right text-xs text-gray-600 font-medium">
                                    Evaluation Remarks
                                  </div>
                                  <ul>
                                    {applicantDetails.applicant_documents
                                      .filter(
                                        (applicantDoc) =>
                                          applicantDoc.qualification_id ===
                                          qualification.id
                                      )
                                      .map((doc, index) => {
                                        const filename = extractFilename(
                                          doc.document_url
                                        )

                                        return (
                                          <li
                                            key={index}
                                            className="mb-2 flex items-center justify-start space-x-1"
                                          >
                                            {/* Display the filename and make it downloadable */}
                                            <Link
                                              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${doc.document_url}`}
                                              download={filename}
                                              target="_blank"
                                              className="text-blue-600 hover:underline"
                                            >
                                              {filename}
                                            </Link>
                                            {doc.status === 'For Evaluation' ? (
                                              <span
                                                className="flex-1 text-red-500 text-xs cursor-pointer"
                                                onClick={() => {
                                                  setSelectedId(doc.id)
                                                  setSelectedUrl(
                                                    doc.document_url
                                                  )
                                                  setShowDeleteModal(true)
                                                }}
                                              >
                                                (Remove File)
                                              </span>
                                            ) : (
                                              <span className="flex-1">
                                                &nbsp;
                                              </span>
                                            )}
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
                                            {doc.status ===
                                              'For Evaluation' && (
                                              <span className="app__status_orange">
                                                For Evaluation
                                              </span>
                                            )}
                                            {doc.remarks !== '' && (
                                              <span className="app__status_gray">
                                                {doc.remarks}
                                              </span>
                                            )}
                                          </li>
                                        )
                                      })}
                                  </ul>
                                </>
                              ) : (
                                <p className="text-gray-500">
                                  No documents uploaded.
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

            <hr className="my-6" />
            {applicantDetails &&
              applicantDetails.ranking.status === 'Open' &&
              !isDateInPast(applicantDetails.ranking.days_to_comply) && (
                <>
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
                          information is accurate and up-to-date.
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
                      {saving ? 'Saving..' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
          </form>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          header="Confirm Delete"
          btnText="Confirm"
          message="This action cannot be undone. Are you sure you want to remove this file?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <Footer />
    </div>
  )
}
export default Page
