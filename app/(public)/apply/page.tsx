'use client'
import { CustomButton, OneColLayoutLoading, TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes, Employee, RankingTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import {
  generateRandomAlphaNumber,
  generateReferenceCode
} from '@/utils/text-helper'
import axios from 'axios'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface ExistingQualificationTypes {
  qualification_name: string
  documents: Array<{
    id: string
    document_url: string
  }>
}

// Major categories and subjects
const elementaryMajors = ['Kindergarten', 'SPED', 'General Education']
const jhsMajors = [
  'English',
  'Filipino',
  'Mathematics',
  'Science - Major in Biology',
  'Science - Major in Chemistry',
  'Science - Major in General Science',
  'Science - Major in Physics',
  'Aralin Panlipunan',
  'MAPEH',
  'Social Science/Values Education',
  'T.L.E - Home Economics',
  'T.L.E - Agri-Fishery',
  'T.L.E - ICT',
  'T.L.E - Industrial Arts'
]
const shsMajors = [
  'Academic Track - Accountancy, Business and Management (ABM)',
  'Academic Track - Science, Technology, Engineering and Mathematics (STEM)',
  'Academic Track - Humanities & Social Science (HUMSS)',
  'Academic Track - General & Academic (GAS)',
  'Arts and Design',
  'Sports',
  'TVL - Agriculture-Fishery Arts (AFA)',
  'TVL - Home Economics (HE)',
  'TVL - Industrial Arts (IA)',
  'TVL - Information and Communication Technology (ICT)'
]

const Page: React.FC = () => {
  const [saving, setSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [isCodeFound, setIsCodeFound] = useState(true)
  const [isCodeOld, setIsCodeOld] = useState(false)
  const [emailFound, setEmailFound] = useState(false)
  const [doneSearch, setDoneSearch] = useState(false)
  const [documents, setDocuments] = useState<File[][]>([])
  const [existingQualification, setExistingQualification] = useState<
    ExistingQualificationTypes[] | []
  >([])

  const [applicantDetails, setApplicantDetails] =
    useState<ApplicantTypes | null>(null)
  const [refCode, setRefCode] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [ranking, setRanking] = useState<RankingTypes | null>(null)
  const searchParams = useSearchParams()
  const { supabase, session } = useSupabase()

  const ranking_id = searchParams.get('ref')

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    setError,
    control,
    handleSubmit
  } = useForm<ApplicantTypes>({
    mode: 'onSubmit',
    defaultValues: {
      type: 'New Applicant'
    }
  })

  const watchedType = watch('type')
  const watchedCurrentEmployee = watch('current_employee')
  const watchedDepedEmail = watch('deped_email')

  const onSubmit = async (formdata: ApplicantTypes) => {
    if (saving) return

    if (watchedCurrentEmployee === 'Yes' && !emailFound) {
      return
    }

    const emailExists = await checkEmailExists(formdata.email)

    if (emailExists) {
      setError('email', {
        type: 'manual',
        message: 'This email already applied for this Ranking.'
      })
      return
    }

    void handleCreate(formdata)
  }

  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .from('hrm_ranking_applicants') // Change to your actual table name
      .select('id')
      .eq('email', email)
      .eq('ranking_id', ranking_id)
      .maybeSingle() // Use maybeSingle() to get a single record or null

    if (error) {
      console.error('Supabase error:', error.message)
      return false
    }
    return data ? true : false
  }

  const handleCreate = async (formdata: ApplicantTypes) => {
    const randomCode = generateRandomAlphaNumber(5)

    setRefCode(randomCode)

    if (saving) return

    setSaving(true)

    const newData = {
      ranking_id,
      type: formdata.type,
      code: randomCode,
      lastname: formdata.lastname,
      firstname: formdata.firstname,
      middlename: formdata.middlename,
      email: formdata.email,
      address: formdata.address,
      age: formdata.age,
      sex: formdata.sex,
      civil_status: formdata.civil_status,
      religion: formdata.religion,
      disability: formdata.disability,
      ethnicity: formdata.ethnicity,
      latin_honor: formdata.latin_honor,
      special_program_beneficiary: formdata.special_program_beneficiary,
      special_skills: formdata.special_skills,
      ethnicity_detail: formdata.ethnicity_detail,
      solo_parent: formdata.solo_parent,
      solo_parent_detail: formdata.solo_parent_detail,
      contact_number: formdata.contact_number,
      specific_major: formdata.specific_major,
      deped_email: formdata.deped_email,
      current_employee: emailFound ? 'Yes' : 'No',
      previous_applicant: formdata.previous_applicant,
      previous_applicant_code: formdata.previous_applicant_code
    }

    try {
      const { data: applicantData, error } = await supabase
        .from('hrm_ranking_applicants')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Ranking application',
          'hrm_ranking_applicants',
          JSON.stringify(newData),
          error.message
        )

        throw new Error(error.message)
      }

      // Upload documents
      if (ranking?.qualifications) {
        // Create an array of promises
        const uploadPromises = ranking.qualifications.map(
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
                      `applicant_documents/${applicantData[0].id}/${newFileName}`,
                      file
                    )

                // Check for upload errors
                if (uploadError) {
                  console.error('Upload error:', uploadError)
                  throw new Error(`Error uploading file: ${file.name}`)
                }

                // Insert the document URL into the database
                await supabase.from('hrm_ranking_applicant_documents').insert({
                  applicant_id: applicantData[0].id,
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
      }

      // Email the applicant on the server side
      axios
        .post('/api/applicantemail', {
          position: ranking?.position?.name,
          email: formdata.email,
          code: randomCode,
          firstname: formdata.firstname,
          middlename: formdata.middlename,
          lastname: formdata.lastname
        })
        .then(function () {
          //
        })
        .catch(function (error) {
          void logError(
            'Approving registration',
            'hrm_registrations',
            JSON.stringify({
              position: ranking?.position?.name,
              email: formdata.email,
              code: randomCode,
              firstname: formdata.firstname,
              middlename: formdata.middlename,
              lastname: formdata.lastname
            }),
            JSON.stringify(error)
          )
          console.error(error)
        })

      setIsSuccess(true)

      setSaving(false)
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
  const handleFifthCharacter = async (value: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('hrm_ranking_applicants')
      .select(
        '*, ranking:ranking_id(*),applicant_documents:hrm_ranking_applicant_documents(*, qualification:qualification_id(*))'
      )
      .neq('ranking_id', ranking_id)
      .eq('code', value)
      .maybeSingle()

    const rkData: ApplicantTypes = data

    if (rkData && rkData.ranking.year !== new Date().getFullYear().toString()) {
      setIsCodeFound(true)
      setIsCodeOld(false)
      setApplicantDetails(rkData)

      setValue('lastname', rkData.lastname)
      setValue('firstname', rkData.firstname)
      setValue('middlename', rkData.middlename)
      setValue('email', rkData.email)
      setValue('previous_applicant', 'Yes')
      setValue('previous_applicant_code', value)

      const groupedDocuments = rkData.applicant_documents.reduce(
        (acc: any, document: any) => {
          const { qualification_id, qualification } = document

          if (!acc[qualification_id]) {
            acc[qualification_id] = {
              qualification_name: qualification.name,
              documents: []
            }
          }

          acc[qualification_id].documents.push(document)
          return acc
        },
        {}
      )
      setExistingQualification(groupedDocuments)
    } else if (
      rkData &&
      rkData.ranking.year === new Date().getFullYear().toString()
    ) {
      setIsCodeOld(true)
    } else {
      setIsCodeOld(false)
      setIsCodeFound(false)
      setApplicantDetails(null)
    }
    setLoading(false)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Check if the input has 5 characters
    if (value.length === 5) {
      void handleFifthCharacter(value)
    } else {
      setApplicantDetails(null)
      setIsCodeFound(true)
    }
  }

  const extractFilename = (url: string) => {
    return url.split('/').pop() // Get the last part of the URL which is the filename
  }

  const handleSearch = async () => {
    setSearching(true)
    setEmailFound(false)
    setDoneSearch(false)

    const { data } = await supabase
      .from('hrm_users')
      .select()
      .eq('email', watchedDepedEmail)
      .maybeSingle()
    if (data) {
      const employeeData: Employee = data
      setEmailFound(true)

      setValue('lastname', employeeData.lastname)
      setValue('firstname', employeeData.firstname)
      setValue('middlename', employeeData.middlename)
      setValue('email', employeeData.email)
    } else {
      setEmailFound(false)
      setValue('lastname', '')
      setValue('firstname', '')
      setValue('middlename', '')
      setValue('email', '')
    }

    setValue('previous_applicant', 'No')
    setValue('previous_applicant_code', '')
    setSearching(false)
    setDoneSearch(true)
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('hrm_rankings')
        .select(
          '*, position:position_id(name),qualifications:hrm_ranking_qualifications(*)'
        )
        .eq('id', ranking_id)
        .single()

      if (data) {
        setRanking(data)
      }
    }
    void fetchData()
  }, [])

  // const sendEmails = async () => {
  //   // Remove this after running one time
  //   const excludedEmails = [
  //     'berlcamp2@gmail.com',
  //     'berlcamp@gmail.com',
  //     'janicetagaan03@gmail.com',
  //     'riqueangelbert@gmail.com',
  //     'gmranario@gmail.com',
  //     'riqueangelbert@gmail.com',
  //     'jullienantes05521@gmail.com',
  //     'beestrong212370@gmail.com',
  //     'emilouaguillon27@gmail.com',
  //     'lopezmich0506@gmail.com',
  //     'emilouaguillon27@gmail.com',
  //     'beestrong212370@gmail.com',
  //     'jolinasilagan16@gmail.com',
  //     'trishaantenero@gmail.com',
  //     'jolinasilagan16@gmail.com',
  //     'azzhirtginette@gmail.com',
  //     'ryanjaycalahat@gmail.com',
  //     'cassarcino.16@gmail.com',
  //     'cassarcino.16@gmail.com',
  //     'cabreros2020@gmail.com',
  //     'salvaleonpinky@gmail.com',
  //     'mangitngitlea5@gmail.com',
  //     'mangitngitlea5@gmail.com',
  //     'alexandrafuentesmaceda@gmail.com',
  //     'lhyzakztyn19@gmail.com',
  //     'anniedelolivar21@gmail.com',
  //     'tayrerechel@gmail.com',
  //     'faithlumor4@gmail.com',
  //     'tayrerechel@gmail.com',
  //     'renalyn.tagubase@deped.gov.ph',
  //     'marideluntal36@gmail.com',
  //     'reymarknavaja600@gmail.com',
  //     'renalyn.tagubase@deped.gov.ph',
  //     'renalyn.tagubase@deped.gov.ph',
  //     'reymarknavaja600@gmail.com',
  //     'elsajosol79@gmail.com',
  //     'giepartos1980@gmail.com'
  //   ]

  //   const { data: applicantsListData } = await supabase
  //     .from('hrm_ranking_applicants')
  //     .select('*, ranking:ranking_id(*,position:position_id(*))')
  //     .not('email', 'in', `(${excludedEmails.map((c) => `'${c}'`).join(',')})`) // Excludes IDs in the array

  //   const applicantsList: ApplicantTypes[] = applicantsListData
  //   // applicantsList?.forEach((a) => {
  //   //   console.log(a.email)
  //   // })
  //   // Send emails concurrently using Promise.all
  //   await Promise.all(
  //     applicantsList.map(async (a) => {
  //       try {
  //         await axios.post('/api/applicantemail', {
  //           position: a.ranking?.position?.name,
  //           email: a.email,
  //           code: a.code,
  //           firstname: a.firstname,
  //           middlename: a.middlename,
  //           lastname: a.lastname
  //         })
  //       } catch (error) {
  //         await logError(
  //           'Sending applicant email',
  //           'hrm_ranking_applicants',
  //           JSON.stringify({
  //             position: a.ranking?.position?.name,
  //             email: a.email,
  //             code: a.code,
  //             firstname: a.firstname,
  //             middlename: a.middlename,
  //             lastname: a.lastname
  //           }),
  //           JSON.stringify(error)
  //         )
  //         console.error('Error sending email to', a.email, error)
  //       }
  //     })
  //   )
  // }

  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="app__single_page_wrapper1">
        {ranking && (
          <div className="app__single_page_wrapper2">
            {isSuccess && (
              <div className="text-gray-700">
                Application successfully submitted. Your application Reference
                Code is <span className="font-bold text-lg">{refCode}</span>
              </div>
            )}
            {!isSuccess && (
              <>
                <div className="app__single_page_title">
                  Apply for{' '}
                  <span className="font-bold">{ranking.position?.name}</span>
                </div>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="app__modal_body"
                >
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="mt-3 flex items-start justify-start space-x-2 text-sm">
                        <label className="space-x-2">
                          <input
                            type="radio"
                            value="New Applicant"
                            {...register('type', { required: true })}
                          />
                          <span>New Applicant</span>
                        </label>

                        <label className="space-x-2">
                          <input
                            type="radio"
                            disabled
                            value="Old Applicant"
                            {...register('type', { required: true })}
                          />
                          <span>Old Applicant</span>
                          <span className="text-xs italic text-gray-500">
                            (Not available for current Ranking Year)
                          </span>
                        </label>

                        {errors.type && (
                          <div className="app__error_message">
                            Type of applicant is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {watchedType === 'Old Applicant' && (
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">
                          Enter your previous application code:
                        </div>
                        <div>
                          <input
                            {...register('code', { required: true })}
                            placeholder="Code"
                            value={inputValue}
                            onChange={handleCodeChange}
                            className="app__input_standard"
                          />
                          {errors.code && (
                            <div className="app__error_message">
                              Application code is required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {watchedType === 'New Applicant' && (
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">
                          Are you a current employee of DepEd?
                        </div>
                        <div className="mt-3 flex items-start justify-start space-x-2 text-sm">
                          <label className="space-x-2">
                            <input
                              type="radio"
                              value="No"
                              {...register('current_employee', {
                                required: true
                              })}
                            />
                            <span>No</span>
                          </label>

                          <label className="space-x-2">
                            <input
                              type="radio"
                              value="Yes"
                              {...register('current_employee', {
                                required: true
                              })}
                            />
                            <span>Yes</span>
                          </label>
                        </div>
                        {errors.current_employee && (
                          <div className="app__error_message">
                            This is required
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {watchedCurrentEmployee === 'Yes' &&
                    watchedType === 'New Applicant' && (
                      <>
                        <div className="app__form_field_container mt-4">
                          <div className="w-full">
                            <div className="app__label_standard">
                              Please type your DepEd email and click "Get
                              Details"
                            </div>
                            <div className="flex space-x-2">
                              <input
                                {...register('deped_email', {
                                  required: true
                                })}
                                className="app__input_standard !w-[200px]"
                              />
                              <CustomButton
                                containerStyles="app__btn_gray"
                                title="Get Details"
                                btnType="button"
                                handleClick={handleSearch}
                              />
                            </div>
                            {errors.deped_email && (
                              <div className="app__error_message">
                                Deped email is required
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  {searching && <TwoColTableLoading />}
                  {(watchedCurrentEmployee === 'No' || doneSearch) && (
                    <>
                      {!emailFound && watchedCurrentEmployee === 'Yes' && (
                        <div className="text-red-500 text-sm font-light">
                          No matching records found.
                        </div>
                      )}
                      {(watchedCurrentEmployee === 'No' ||
                        (watchedCurrentEmployee === 'Yes' && emailFound)) && (
                        <>
                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Firstname
                              </div>
                              <div>
                                <input
                                  {...register('firstname', { required: true })}
                                  className="app__input_standard"
                                />
                                {errors.firstname && (
                                  <div className="app__error_message">
                                    Firstname is required
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="app__form_field_container">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Middlename
                              </div>
                              <div>
                                <input
                                  {...register('middlename', {
                                    required: true
                                  })}
                                  className="app__input_standard"
                                />
                                {errors.middlename && (
                                  <div className="app__error_message">
                                    Firstname is required
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="app__form_field_container">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Lastname
                              </div>
                              <div>
                                <input
                                  {...register('lastname', { required: true })}
                                  className="app__input_standard"
                                />
                                {errors.lastname && (
                                  <div className="app__error_message">
                                    Lastname is required
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="app__form_field_container">
                            <div className="w-full">
                              <div className="app__label_standard">Email</div>
                              <div>
                                <input
                                  type="email"
                                  className="app__input_standard"
                                  {...register('email', {
                                    required: 'Email is required'
                                  })}
                                />
                                {errors.email && (
                                  <div className="app__error_message">
                                    {errors.email.message}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">Address</div>
                              <input
                                {...register('address', {
                                  required: 'Address is required'
                                })}
                                className="app__input_standard"
                              />
                              {errors.address && (
                                <div className="app__error_message">
                                  {errors.address.message}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">Age</div>
                              <input
                                type="number"
                                {...register('age', {
                                  required: 'Age is required',
                                  min: 1
                                })}
                                className="app__input_standard"
                              />
                              {errors.age && (
                                <div className="app__error_message">
                                  {errors.age.message}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">Sex</div>
                              <select
                                {...register('sex', {
                                  required: 'Sex is required'
                                })}
                                className="app__input_standard"
                              >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                              {errors.sex && (
                                <div className="app__error_message">
                                  {errors.sex.message}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Civil Status
                              </div>
                              <select
                                {...register('civil_status', {
                                  required: 'Civil Status is required'
                                })}
                                className="app__input_standard"
                              >
                                <option value="">Select</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Divorced">Divorced</option>
                              </select>
                              {errors.civil_status && (
                                <div className="app__error_message">
                                  {errors.civil_status.message}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Religion
                              </div>
                              <input
                                {...register('religion', {
                                  required: 'Religion is required'
                                })}
                                className="app__input_standard"
                              />
                              {errors.religion && (
                                <div className="app__error_message">
                                  {errors.religion.message}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Disability
                              </div>
                              <input
                                {...register('disability')}
                                className="app__input_standard"
                              />
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Member of Ethnic Group?
                              </div>
                              <div>
                                <label>
                                  <input
                                    type="radio"
                                    value="Yes"
                                    {...register('ethnicity')}
                                  />{' '}
                                  Yes
                                </label>
                                <label className="ml-4">
                                  <input
                                    type="radio"
                                    value="No"
                                    {...register('ethnicity')}
                                  />{' '}
                                  No
                                </label>
                                {watch('ethnicity') === 'Yes' && (
                                  <input
                                    {...register('ethnicity_detail')}
                                    placeholder="Specify ethnicity"
                                    className="app__input_standard mt-2"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                With Latin Honor?
                              </div>
                              <div>
                                <label>
                                  <input
                                    type="radio"
                                    value="Yes"
                                    {...register('latin_honor_yesno')}
                                  />{' '}
                                  Yes
                                </label>
                                <label className="ml-4">
                                  <input
                                    type="radio"
                                    value="No"
                                    {...register('latin_honor_yesno')}
                                  />{' '}
                                  No
                                </label>
                                {watch('latin_honor_yesno') === 'Yes' && (
                                  <input
                                    {...register('latin_honor')}
                                    placeholder="Specify Latin Honor"
                                    className="app__input_standard mt-2"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Special Program Beneficiary? (4ps, SPIMS, DOST)
                              </div>
                              <div>
                                <label>
                                  <input
                                    type="radio"
                                    value="Yes"
                                    {...register(
                                      'special_program_beneficiary_yesno'
                                    )}
                                  />{' '}
                                  Yes
                                </label>
                                <label className="ml-4">
                                  <input
                                    type="radio"
                                    value="No"
                                    {...register(
                                      'special_program_beneficiary_yesno'
                                    )}
                                  />{' '}
                                  No
                                </label>
                                {watch('special_program_beneficiary_yesno') ===
                                  'Yes' && (
                                  <input
                                    {...register('special_program_beneficiary')}
                                    placeholder="Special Program Beneficiary"
                                    className="app__input_standard mt-2"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Special Skills:
                              </div>
                              <div>
                                <input
                                  {...register('special_skills')}
                                  placeholder="Special Skills"
                                  className="app__input_standard"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Solo Parent
                              </div>
                              <div>
                                <label>
                                  <input
                                    type="radio"
                                    value="Yes"
                                    {...register('solo_parent')}
                                  />{' '}
                                  Yes
                                </label>
                                <label className="ml-4">
                                  <input
                                    type="radio"
                                    value="No"
                                    {...register('solo_parent')}
                                  />{' '}
                                  No
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="app__form_field_container mt-4">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Contact Number
                              </div>
                              <input
                                type="tel"
                                {...register('contact_number', {
                                  required: 'Contact Number is required'
                                })}
                                className="app__input_standard"
                              />
                              {errors.contact_number && (
                                <div className="app__error_message">
                                  {errors.contact_number.message}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Specific Major Field (Dependent on selected category) */}
                          {ranking.department !== 'Non-Teaching' && (
                            <div className="app__form_field_container">
                              <label className="app__label_standard">
                                Select Specific Major
                              </label>
                              <select
                                {...register('specific_major', {
                                  required: 'Please select a specific major'
                                })}
                                className="app__input_standard"
                              >
                                <option value="">
                                  -- Select Specific Major --
                                </option>
                                {ranking.department === 'Elementary' &&
                                  elementaryMajors.map((specific_major) => (
                                    <option
                                      key={specific_major}
                                      value={specific_major}
                                    >
                                      {specific_major}
                                    </option>
                                  ))}
                                {ranking.department === 'Junior High School' &&
                                  jhsMajors.map((specific_major) => (
                                    <option
                                      key={specific_major}
                                      value={specific_major}
                                    >
                                      {specific_major}
                                    </option>
                                  ))}
                                {ranking.department === 'Senior High School' &&
                                  shsMajors.map((specific_major) => (
                                    <option
                                      key={specific_major}
                                      value={specific_major}
                                    >
                                      {specific_major}
                                    </option>
                                  ))}
                                {ranking.department === 'Secondary' &&
                                  jhsMajors.map((specific_major) => (
                                    <option
                                      key={specific_major}
                                      value={specific_major}
                                    >
                                      {specific_major}
                                    </option>
                                  ))}
                                {ranking.department === 'Secondary' &&
                                  shsMajors.map((specific_major) => (
                                    <option
                                      key={specific_major}
                                      value={specific_major}
                                    >
                                      {specific_major}
                                    </option>
                                  ))}
                              </select>
                              {errors.specific_major && (
                                <span className="app__error_message">
                                  {errors.specific_major.message}
                                </span>
                              )}
                            </div>
                          )}

                          <div>
                            <div className="text-gray-600 text-sm">
                              Upload supporting documents for each Qualification
                              Standards:{' '}
                            </div>
                            <div className="p-4 bg-gray-50 border space-y-6">
                              <div className="text-center text-sm">
                                QUALIFICATION STANDARDS
                              </div>
                              {ranking.qualifications.map(
                                (qualification, index) => (
                                  <div key={qualification.id}>
                                    <h3 className="text-gray-700 text-sm font-bold">
                                      {index + 1}. {qualification.name}{' '}
                                      {qualification.required && (
                                        <span className="text-red-500 font-normal">
                                          (Required)
                                        </span>
                                      )}
                                    </h3>
                                    <div className="text-xs text-gray-600 pl-4">
                                      {qualification.description}
                                    </div>
                                    {/* <input
                                      type="file"
                                      multiple
                                      onChange={(e) =>
                                        handleFileUpload(index, e.target.files)
                                      }
                                      className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                     */}
                                    {/* File input with react-hook-form Controller */}
                                    <Controller
                                      name={`files.${index}`}
                                      control={control}
                                      rules={{
                                        required: qualification.required
                                          ? 'This qualification standard is required.'
                                          : false
                                      }}
                                      render={({ field }) => (
                                        <input
                                          type="file"
                                          multiple
                                          onChange={(e) => {
                                            field.onChange(e.target.files) // Update field value
                                            handleFileUpload(
                                              index,
                                              e.target.files
                                            ) // Custom handler
                                          }}
                                          ref={field.ref}
                                          className={`mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-500 ${
                                            errors?.files?.[index]
                                              ? 'border-red-500'
                                              : ''
                                          }`}
                                        />
                                      )}
                                    />
                                    {/* Error message */}
                                    {errors?.files?.[index] && (
                                      <div className="app__error_message">
                                        {errors.files[index]?.message}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {loading && <OneColLayoutLoading rows={4} />}
                  {!loading &&
                    watchedType === 'Old Applicant' &&
                    !isCodeFound && (
                      <div className="text-red-500 bg-red-100 border border-red-500 text-xs p-1">
                        No matching application for this code.
                      </div>
                    )}
                  {!loading && watchedType === 'Old Applicant' && isCodeOld && (
                    <div className="text-red-500 bg-red-100 border border-red-500 text-xs p-1">
                      You can only use application codes that was applied from
                      last year.
                    </div>
                  )}
                  {!loading &&
                    watchedType === 'Old Applicant' &&
                    applicantDetails && (
                      <div className="grid gap-4">
                        <div>
                          <div className="app__label_standard">
                            Applicant Details:
                          </div>
                          <div className="app__label_value">
                            {applicantDetails.firstname}{' '}
                            {applicantDetails.middlename}{' '}
                            {applicantDetails.lastname}
                            <span className="font-light">
                              ({applicantDetails.email})
                            </span>
                          </div>
                          <div className="app__label_value">
                            {applicantDetails.age} years old,{' '}
                            {applicantDetails.sex} (
                            {applicantDetails.civil_status})
                          </div>
                          <div className="app__label_value">
                            {applicantDetails.address}
                          </div>
                        </div>
                        <div>
                          <div className="app__label_standard">
                            Specific Major: {applicantDetails.specific_major}
                          </div>
                        </div>
                        <div>
                          <div className="app__label_standard">
                            Disability: {applicantDetails.disability}
                          </div>
                        </div>
                        <div>
                          <div className="app__label_standard">
                            Member of Ethnic Group? {applicantDetails.ethnicity}{' '}
                            {applicantDetails.ethnicity_detail}
                          </div>
                        </div>
                        <div>
                          <div className="app__label_standard">
                            Solo Parent: {applicantDetails.solo_parent}{' '}
                            {applicantDetails.solo_parent_detail}
                          </div>
                        </div>
                        <div>
                          <div className="p-4 bg-gray-50 border space-y-6">
                            <div className="text-center text-sm">
                              PREVIOUSLY SUBMITTED QUALIFICATION STANDARDS
                            </div>
                            {Object.entries(existingQualification).map(
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
                            {Object.entries(existingQualification).length ===
                              0 && <div>No records found.</div>}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-sm">
                            Upload updated supporting documents for each
                            Qualification Standards (If applicable):{' '}
                          </div>
                          <div className="p-4 bg-gray-50 border space-y-6">
                            <div className="text-center text-sm">
                              QUALIFICATION STANDARDS
                            </div>
                            {ranking.qualifications.map(
                              (qualification, index) => (
                                <div key={qualification.id}>
                                  <h3 className="text-gray-700 text-sm font-bold">
                                    {index + 1}. {qualification.name}{' '}
                                    {qualification.required && (
                                      <span className="text-red-500 font-normal">
                                        (Required)
                                      </span>
                                    )}
                                  </h3>
                                  <div className="text-xs text-gray-600 pl-4">
                                    {qualification.description}
                                  </div>
                                  {/* File input with react-hook-form Controller */}
                                  <Controller
                                    name={`files.${index}`}
                                    control={control}
                                    rules={{
                                      required: qualification.required
                                        ? 'This qualification standard is required.'
                                        : false
                                    }}
                                    render={({ field }) => (
                                      <input
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                          field.onChange(e.target.files) // Update field value
                                          handleFileUpload(
                                            index,
                                            e.target.files
                                          ) // Custom handler
                                        }}
                                        ref={field.ref}
                                        className={`mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-500 ${
                                          errors?.files?.[index]
                                            ? 'border-red-500'
                                            : ''
                                        }`}
                                      />
                                    )}
                                  />
                                  {/* Error message */}
                                  {errors?.files?.[index] && (
                                    <div className="app__error_message">
                                      {errors.files[index]?.message}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  <hr className="my-6" />
                  {(watchedType === 'New Applicant' || applicantDetails) && (
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
                      <div className="mt-4">
                        {/* Display all form errors */}
                        {Object.values(errors).length > 0 && (
                          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-3">
                            <ul className="list-disc list-inside">
                              <li>
                                Some fields have errors, please check above
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="app__modal_footer">
                        <CustomButton
                          btnType="submit"
                          isDisabled={saving}
                          title={saving ? 'Saving...' : 'Submit'}
                          containerStyles="app__btn_green"
                        />
                        {/* {session.user.email === 'berlcamp@gmail.com' && (
                          <CustomButton
                            btnType="button"
                            isDisabled={saving}
                            title={saving ? 'Saving...' : 'Send Emails'}
                            handleClick={sendEmails}
                            containerStyles="app__btn_green"
                          />
                        )} */}
                      </div>
                    </>
                  )}
                </form>
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
export default Page
