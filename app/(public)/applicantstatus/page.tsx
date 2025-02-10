'use client'
import { TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantDocuments, ApplicantTypes } from '@/types'
import { generateReferenceCode } from '@/utils/text-helper'
import { format, isEqual, isFuture } from 'date-fns'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [isCodeFound, setIsCodeFound] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const [applicantDetails, setApplicantDetails] =
    useState<ApplicantTypes | null>(null)

  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [inputValue, setInputValue] = useState(code ?? '')
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const handleFileUpload = async (
    qualificationId: string,
    file: File | null
  ) => {
    if (!file || !applicantDetails) {
      setToast('error', 'No file selected')
      return
    }

    setIsUploading(true) // Start loading

    try {
      const randomString = generateReferenceCode()
      const fileExtension = file.name.split('.').pop()
      const newFileName = `${randomString}.${fileExtension}`
      const folderPath = `applicant_documents/${applicantDetails.id}/`

      // **Step 1: List existing files in the applicant's folder**
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('hrm_public')
        .list(folderPath)

      if (listError) {
        setToast('error', 'Error listing files:', listError.message)
        throw new Error(listError.message)
      }

      // **Step 2: Delete existing files (if any)**
      if (existingFiles && existingFiles.length > 0) {
        const deletePaths = existingFiles.map(
          (file: any) => `${folderPath}${file.name}`
        )
        const { error: deleteError } = await supabase.storage
          .from('hrm_public')
          .remove(deletePaths)

        if (deleteError) {
          setToast('error', 'Error removing files:', deleteError.message)
          throw new Error(deleteError.message)
        }
      }

      // **Step 3: Upload the new file**
      const filePath = `${folderPath}${newFileName}`
      const { error: uploadError } = await supabase.storage
        .from('hrm_public')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // **Step 4: Get the public URL of the uploaded file**
      const { data: publicURLData } = supabase.storage
        .from('hrm_public')
        .getPublicUrl(filePath)

      const fileUrl = publicURLData.publicUrl

      // **Step 5: Delete existing database records for this applicant & qualification**
      const { error: deleteDbError } = await supabase
        .from('hrm_ranking_applicant_documents')
        .delete()
        .match({
          applicant_id: applicantDetails.id,
          qualification_id: qualificationId
        })

      if (deleteDbError) {
        setToast(
          'error',
          'Error deleting existing database records:',
          deleteDbError.message
        )
        throw new Error(deleteDbError.message)
      }

      // **Step 6: Insert the new file record into the database**
      const { error: dbError } = await supabase
        .from('hrm_ranking_applicant_documents')
        .insert({
          applicant_id: applicantDetails.id,
          qualification_id: qualificationId,
          document_url: fileUrl
        })

      if (dbError) {
        setToast('error', 'Error inserting files:', dbError.message)
        throw new Error(dbError.message)
      }

      console.log('File successfully replaced and saved to database:', fileUrl)

      void handleSearch()
    } catch (error) {
      console.error('Unexpected error during file upload:', error)
    } finally {
      setIsUploading(false) // Stop loading
    }
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
  const isDateInPast = (dateString: string) => {
    if (!dateString) {
      return false // Treat invalid dates as not in the past
    }

    // const inputDate = startOfDay(parseISO(dateString))

    return (
      isFuture(new Date(dateString)) ||
      isEqual(new Date(dateString), new Date())
    )
  }

  const qualificationStatus = (statuses: ApplicantDocuments[]) => {
    const qualifications = applicantDetails?.ranking?.qualifications

    if (statuses.length === 0 || !qualifications) {
      return 'No Qualifications'
    }

    // Filter required qualifications
    const requiredQualifications = qualifications.filter((q) => q.required)

    // Check if all required qualifications exist in statuses
    const allRequiredExist = requiredQualifications.every((q) =>
      statuses.some((s) => s.qualification_id === q.id)
    )

    if (!allRequiredExist) {
      return 'Not Qualified'
    }

    // Extract statuses for required qualifications only
    const requiredStatuses = statuses.filter((s) =>
      requiredQualifications.some((q) => q.id === s.qualification_id)
    )

    if (requiredStatuses.some((s) => s.status === 'Not Okay')) {
      return 'Not Qualified'
    }

    if (requiredStatuses.some((s) => s.status === 'For Evaluation')) {
      return 'For Evaluation'
    }

    if (requiredStatuses.every((s) => s.status === 'Okay')) {
      return 'Qualified'
    }

    return 'Not Known'
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

          {isUploading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-4 rounded-md shadow-md">
                <span className="text-lg font-semibold">Uploading...</span>
              </div>
            </div>
          )}

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

          {applicantDetails && applicantDetails.ranking.status === 'Closed' && (
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
                            {qualification.required && (
                              <span className="font-bold text-red-500">
                                (Required)
                              </span>
                            )}
                          </h3>
                          <div className="text-xs text-gray-600 pl-4">
                            {qualification.description}{' '}
                          </div>
                          {/* File Input Wrapper */}
                          <div className="pl-4 flex">
                            <div className="border border-dashed bg-gray-200 text-gray-600 my-4 text-xs p-4">
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] // Get the first file from FileList
                                  if (file && qualification.id) {
                                    void handleFileUpload(
                                      qualification.id,
                                      file
                                    )
                                  }
                                }}
                                className="hidden" // Hides the default file input
                                id={`fileUpload-${qualification.id}`}
                              />

                              {/* Custom Button for File Input */}
                              <label
                                htmlFor={`fileUpload-${qualification.id}`}
                                className="cursor-pointer"
                              >
                                <span>
                                  Click here to upload/replace existing document
                                  for this qualification (PDF Format)
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="pl-4">
                            {applicantDetails.applicant_documents.filter(
                              (applicantDoc) =>
                                applicantDoc.qualification_id ===
                                qualification.id
                            ).length > 0 ? (
                              <>
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
                                          className="mb-2 flex items-center justify-start space-x-2"
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
        </div>
      </div>
      <Footer />
    </div>
  )
}
export default Page
