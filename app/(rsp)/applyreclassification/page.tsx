'use client'
import { SearchUserInput, TopBarDark, UserBlock } from '@/components/index'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  runListQuery,
  runQuery,
  type QueryError
} from '@/utils/query-result'
import { ApplicantTypes, Employee } from '@/types'
import { generateRandomAlphaNumber } from '@/utils/text-helper'
import { PaperClipIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

const Page: React.FC = () => {
  const [saving, setSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [applicantExist, setApplicantExist] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loadError, setLoadError] = useState<QueryError | null>(null)
  const [refCode, setRefCode] = useState('')
  const [doneSearch, setDoneSearch] = useState(false)

  const [user, setUser] = useState<Employee | null>(null)

  const [applicantDetails, setApplicantDetails] = useState<Employee | null>(
    null
  )
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [file3, setFile3] = useState<File | null>(null)
  const [file4, setFile4] = useState<File | null>(null)
  const [file5, setFile5] = useState<File | null>(null)
  const [file6, setFile6] = useState<File | null>(null)

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile1(selectedFile)
  }
  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile2(selectedFile)
  }
  const handleFile3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile3(selectedFile)
  }
  const handleFile4Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile4(selectedFile)
  }
  const handleFile5Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile5(selectedFile)
  }
  const handleFile6Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile6(selectedFile)
  }

  const {
    register,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    handleSubmit
  } = useForm<ApplicantTypes>({
    mode: 'onSubmit',
    defaultValues: {
      current_approver_id: ''
    }
  })

  const onSubmit = async (FormData: ApplicantTypes) => {
    if (saving) return

    if (!applicantDetails) {
      return
    }

    setSaving(true)

    void handleCreate(FormData)
  }

  const handleCreate = async (FormData: ApplicantTypes) => {
    if (!applicantDetails) return

    const randomCode = generateRandomAlphaNumber(5)
    setRefCode(randomCode)

    let file1Path: string | null = null
    let file2Path: string | null = null
    let file3Path: string | null = null
    let file4Path: string | null = null
    let file5Path: string | null = null
    let file6Path: string | null = null
    // Upload file if it exists
    if (file1) {
      const sanitizedFileName = file1.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const fileName = `${Date.now()}_${sanitizedFileName}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('hrm_public') // Replace with your storage bucket name
        .upload(`reclass_documents/${fileName}`, file1)

      if (fileError) throw new Error(fileError.message)
      file1Path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${fileData.path}` // Get the path of the uploaded file
    }
    if (file2) {
      const sanitizedFileName = file2.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const fileName = `${Date.now()}_${sanitizedFileName}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('hrm_public') // Replace with your storage bucket name
        .upload(`reclass_documents/${fileName}`, file2)

      if (fileError) throw new Error(fileError.message)
      file2Path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${fileData.path}` // Get the path of the uploaded file
    }
    if (file3) {
      const sanitizedFileName = file3.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const fileName = `${Date.now()}_${sanitizedFileName}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('hrm_public') // Replace with your storage bucket name
        .upload(`reclass_documents/${fileName}`, file3)

      if (fileError) throw new Error(fileError.message)
      file3Path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${fileData.path}` // Get the path of the uploaded file
    }
    if (file4) {
      const sanitizedFileName = file4.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const fileName = `${Date.now()}_${sanitizedFileName}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('hrm_public') // Replace with your storage bucket name
        .upload(`reclass_documents/${fileName}`, file4)

      if (fileError) throw new Error(fileError.message)
      file4Path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${fileData.path}` // Get the path of the uploaded file
    }
    if (file5) {
      const sanitizedFileName = file5.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const fileName = `${Date.now()}_${sanitizedFileName}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('hrm_public') // Replace with your storage bucket name
        .upload(`reclass_documents/${fileName}`, file5)

      if (fileError) throw new Error(fileError.message)
      file5Path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${fileData.path}` // Get the path of the uploaded file
    }
    if (file6) {
      const sanitizedFileName = file6.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const fileName = `${Date.now()}_${sanitizedFileName}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('hrm_public') // Replace with your storage bucket name
        .upload(`reclass_documents/${fileName}`, file6)

      if (fileError) throw new Error(fileError.message)
      file6Path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${fileData.path}` // Get the path of the uploaded file
    }

    const newData = {
      user_id: applicantDetails.id,
      current_approver_id: user?.id,
      lastname: applicantDetails.lastname,
      firstname: applicantDetails.lastname,
      middlename: applicantDetails.lastname,
      office_id: applicantDetails.office_id,
      school_id: applicantDetails.school_id,
      type: 'Reclassification',
      status: 'For AO Verification',
      current_employee: 'Yes',
      code: randomCode,
      email: applicantDetails.email,
      professional_study: FormData.professional_study,
      teaching_public_school: FormData.teaching_public_school,
      teaching_private_school: FormData.teaching_private_school,
      supervisory_public_school: FormData.supervisory_public_school,
      supervisory_private_school: FormData.supervisory_private_school,
      seminars: FormData.seminars,
      professional_study_file_path: file1Path,
      teaching_public_school_file_path: file2Path,
      teaching_private_school_file_path: file3Path,
      supervisory_public_school_file_path: file4Path,
      supervisory_private_school_file_path: file5Path,
      seminars_file_path: file6Path
    }

    try {
      // Applicant row and its opening flow row go in together: a failure
      // part-way used to leave an application with no flow, invisible to the
      // ERF screening queues, while the applicant saw nothing at all. See
      // supabase/migrations/0021_create_ranking_applicant.sql
      const created = await runQuery<{ id: string }>(
        {
          transaction: 'Reclassification application',
          table: 'hrm_ranking_applicants',
          payload: newData
        },
        supabase.rpc('create_ranking_applicant', {
          p_applicant: newData,
          p_user_id: session?.user.id,
          p_receiver_id: user?.id
        })
      )

      if (!created.ok || !created.data) {
        setToast(
          'error',
          created.ok
            ? 'Your application was not submitted. Please try again.'
            : `Your application was not submitted. ${created.error.message}`
        )
        return
      }

      // Best-effort: this is how the approving officer is told, but the
      // application already stands and is already in their queue, so a failed
      // notification must not fail the submission.
      await runQuery(
        {
          transaction: 'Notify AO of reclassification application',
          table: 'hrm_notifications',
          payload: { applicantId: created.data.id }
        },
        supabase.from('hrm_notifications').insert({
          message: `The Reclassication Application #${randomCode} has been forwarded to you for verification/approval.`,
          url: `/erfscreening/${randomCode}`,
          type: 'Forwarded',
          user_id: user?.id,
          reference_table: 'hrm_ranking_applicants'
        })
      )

      setIsSuccess(true)
    } catch (e) {
      console.error(e)
      setToast(
        'error',
        'Your application was not submitted. Please reload the page and try again.'
      )
    } finally {
      // finally, not the success path: the early returns above must still
      // release the Submit button.
      setSaving(false)
    }
  }

  useEffect(() => {
    const handleSearch = async () => {
      setSearching(true)
      setLoadError(null)
      setDoneSearch(false)
      setApplicantExist(false)
      setApplicantDetails(null)

      // search if user has existing active application
      const existing = await runListQuery<any>(
        {
          transaction: 'Check for an existing reclassification application',
          table: 'hrm_ranking_applicants',
          payload: { email: session?.user.email }
        },
        supabase
          .from('hrm_ranking_applicants')
          .select()
          .eq('email', session?.user.email)
          .eq('type', 'Reclassification')
          .eq('status', 'Active')
      )

      // This is the only guard against filing a second application. Falling
      // through on failure let the form open and a duplicate be submitted, so
      // a failed check now stops here instead.
      if (!existing.ok) {
        setLoadError(existing.error)
        setSearching(false)
        return
      }

      if (existing.data.length > 0) {
        setSearching(false)
        setDoneSearch(true)
        setApplicantExist(true)
        return
      }

      const details = await runQuery<any>(
        {
          transaction: 'Fetch own details for reclassification',
          table: 'hrm_users',
          payload: { userId: session?.user.id }
        },
        supabase
          .from('hrm_users')
          .select('*,hrm_item:item_id(*),hrm_positions:position_id(name)')
          .eq('id', session?.user.id)
          .maybeSingle()
      )

      if (!details.ok) {
        setLoadError(details.error)
        setSearching(false)
        return
      }

      if (details.data) {
        setApplicantDetails(details.data)
      }

      setSearching(false)
      setDoneSearch(true)
    }
    void handleSearch()
  }, [])

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
      setValue('current_approver_id', selectedUsers[0].id)
      clearErrors('current_approver_id')
    } else {
      setUser(null)
      setValue('current_approver_id', '')
      setError('current_approver_id', {
        type: 'manual',
        message: 'AO is required'
      })
    }
  }

  // Register the hidden field to enforce validation
  useEffect(() => {
    register('current_approver_id', { required: 'AO is required' })
  }, [register])

  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="app__single_page_wrapper1">
        <div className="app__single_page_wrapper2">
          {isSuccess && (
            <div className="text-gray-700">
              Application successfully submitted. Your application Reference
              Code is <span className="font-bold text-lg">{refCode}</span>
            </div>
          )}
          {!isSuccess && (
            <>
              <div className="px-4 text-lg text-center uppercase font-semibold text-gray-700">
                Application for Reclassification
              </div>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="app__modal_body"
              >
                <div className="app__form_field_container mt-4">
                  {applicantExist && doneSearch && (
                    <div className="text-red-500 text-sm font-medium">
                      You currently have active reclassification application.
                    </div>
                  )}
                </div>

                {loadError && (
                  <div className="my-3 border border-red-300 bg-red-50 px-3 py-2">
                    <div className="text-sm text-red-700">
                      {loadError.message} The form is not shown, because we
                      could not confirm whether you already have an active
                      application.
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-gray-500">
                      {loadError.cause}
                    </div>
                  </div>
                )}
                {searching && <TwoColTableLoading />}
                {!searching && applicantDetails && (
                  <div className="grid gap-4">
                    <div>
                      <div className="app__label_standard">Applicant Name:</div>
                      <div className="app__label_value">
                        <UserBlock user={applicantDetails} />
                      </div>
                    </div>
                    <div>
                      <div className="app__label_standard">Item No:</div>
                      <div className="app__label_value">
                        {applicantDetails.hrm_item?.item_number}
                      </div>
                    </div>
                    <div>
                      <div className="app__label_standard">
                        Authorized Position Title:
                      </div>
                      <div className="app__label_value">
                        {applicantDetails.hrm_positions?.name}
                      </div>
                    </div>
                    <hr className="my-2" />
                    <div className="font-light text-center">EXPERIENCED</div>
                    <div>
                      <div className="app__label_standard">
                        1. Professional Study
                      </div>
                      <div>
                        <input
                          {...register('professional_study')}
                          placeholder="Inclusive Dates"
                          className="app__input_standard"
                        />
                        <div className="my-2 flex flex-col space-y-2 items-start">
                          {/* File Input Wrapper */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg, .gif"
                              onChange={handleFile1Change}
                              className="hidden" // Hides the default file input
                              id="fileUpload1"
                            />

                            {/* Custom Button for File Input */}
                            <label
                              htmlFor="fileUpload1"
                              className="cursor-pointer flex items-start space-x-2"
                            >
                              <span className="text-sm text-gray-700">
                                Attachment
                              </span>
                              <PaperClipIcon className="w-4 h-4" />
                            </label>

                            {file1 && (
                              <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Selected: {file1.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="app__label_standard">
                        2.1 Teaching Experienced (Public School)
                      </div>
                      <div>
                        <input
                          {...register('teaching_public_school')}
                          placeholder="Inclusive Dates"
                          className="app__input_standard"
                        />
                        <div className="my-2 flex flex-col space-y-2 items-start">
                          {/* File Input Wrapper */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg, .gif"
                              onChange={handleFile2Change}
                              className="hidden" // Hides the default file input
                              id="fileUpload2"
                            />

                            {/* Custom Button for File Input */}
                            <label
                              htmlFor="fileUpload2"
                              className="cursor-pointer flex items-start space-x-2"
                            >
                              <span className="text-sm text-gray-700">
                                Attachment
                              </span>
                              <PaperClipIcon className="w-4 h-4" />
                            </label>

                            {file2 && (
                              <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Selected: {file2.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="app__label_standard">
                        2.2 Teaching Experienced (Private School)
                      </div>
                      <div>
                        <input
                          {...register('teaching_private_school')}
                          placeholder="Inclusive Dates"
                          className="app__input_standard"
                        />
                        <div className="my-2 flex flex-col space-y-2 items-start">
                          {/* File Input Wrapper */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg, .gif"
                              onChange={handleFile3Change}
                              className="hidden" // Hides the default file input
                              id="fileUpload3"
                            />

                            {/* Custom Button for File Input */}
                            <label
                              htmlFor="fileUpload3"
                              className="cursor-pointer flex items-start space-x-2"
                            >
                              <span className="text-sm text-gray-700">
                                Attachment
                              </span>
                              <PaperClipIcon className="w-4 h-4" />
                            </label>

                            {file3 && (
                              <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Selected: {file3.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="app__label_standard">
                        3.1 Administrative Supervisory (Public School)
                      </div>
                      <div>
                        <input
                          {...register('supervisory_public_school')}
                          placeholder="Inclusive Dates"
                          className="app__input_standard"
                        />
                        <div className="my-2 flex flex-col space-y-2 items-start">
                          {/* File Input Wrapper */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg, .gif"
                              onChange={handleFile4Change}
                              className="hidden" // Hides the default file input
                              id="fileUpload4"
                            />

                            {/* Custom Button for File Input */}
                            <label
                              htmlFor="fileUpload4"
                              className="cursor-pointer flex items-start space-x-2"
                            >
                              <span className="text-sm text-gray-700">
                                Attachment
                              </span>
                              <PaperClipIcon className="w-4 h-4" />
                            </label>

                            {file4 && (
                              <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Selected: {file4.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="app__label_standard">
                        3.2 Administrative Supervisory Experienced (Private
                        School)
                      </div>
                      <div>
                        <input
                          {...register('supervisory_private_school')}
                          placeholder="Inclusive Dates"
                          className="app__input_standard"
                        />
                        <div className="my-2 flex flex-col space-y-2 items-start">
                          {/* File Input Wrapper */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg, .gif"
                              onChange={handleFile5Change}
                              className="hidden" // Hides the default file input
                              id="fileUpload5"
                            />

                            {/* Custom Button for File Input */}
                            <label
                              htmlFor="fileUpload5"
                              className="cursor-pointer flex items-start space-x-2"
                            >
                              <span className="text-sm text-gray-700">
                                Attachment
                              </span>
                              <PaperClipIcon className="w-4 h-4" />
                            </label>

                            {file5 && (
                              <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Selected: {file5.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="app__label_standard">
                        4. Others(Seminars, Workshop, etc.)
                      </div>
                      <div>
                        <input
                          {...register('seminars')}
                          placeholder="Inclusive Dates"
                          className="app__input_standard"
                        />
                        <div className="my-2 flex flex-col space-y-2 items-start">
                          {/* File Input Wrapper */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg, .gif"
                              onChange={handleFile6Change}
                              className="hidden" // Hides the default file input
                              id="fileUpload6"
                            />

                            {/* Custom Button for File Input */}
                            <label
                              htmlFor="fileUpload6"
                              className="cursor-pointer flex items-start space-x-2"
                            >
                              <span className="text-sm text-gray-700">
                                Attachment
                              </span>
                              <PaperClipIcon className="w-4 h-4" />
                            </label>

                            {file6 && (
                              <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Selected: {file6.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {applicantDetails && !applicantExist && (
                  <>
                    <hr className="my-6" />
                    <div className="w-full lg:w-1/2 px-4">
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Submit to your Administrative Officer
                          </div>
                          <SearchUserInput
                            isMultiple={false}
                            excludedIds={session ? [session.user.id] : []}
                            handleSelectedUsers={handleSelectedUsers}
                          />
                          {errors.current_approver_id && (
                            <div className="app__error_message">
                              {errors.current_approver_id.message}
                            </div>
                          )}
                        </div>
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
                        {saving ? 'Submiting..' : 'Apply Now'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
export default Page
