'use client'
import { CustomButton, TopBarDark, UserBlock } from '@/components'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes, Employee } from '@/types'
import { logError } from '@/utils/fetchApi'
import { generateRandomAlphaNumber } from '@/utils/text-helper'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

const Page: React.FC = () => {
  const [saving, setSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailFound, setEmailFound] = useState(false)
  const [applicantExist, setApplicantExist] = useState(false)
  const [searching, setSearching] = useState(false)
  const [refCode, setRefCode] = useState('')
  const [doneSearch, setDoneSearch] = useState(false)

  const [applicantDetails, setApplicantDetails] = useState<Employee | null>(
    null
  )
  const { supabase, session } = useSupabase()

  const {
    register,
    formState: { errors },
    watch,
    handleSubmit
  } = useForm<ApplicantTypes>({
    mode: 'onSubmit'
  })

  const watchedDepedEmail = watch('deped_email')

  const onSubmit = async () => {
    if (saving) return

    if (!applicantDetails) {
      return
    }

    setSaving(true)

    void handleCreate()
  }

  const handleCreate = async () => {
    const randomCode = generateRandomAlphaNumber(5)
    setRefCode(randomCode)

    const newData = {
      user_id: applicantDetails?.id,
      lastname: applicantDetails?.lastname,
      firstname: applicantDetails?.lastname,
      middlename: applicantDetails?.lastname,
      type: 'Reclassification',
      current_employee: 'Yes',
      code: randomCode,
      email: watchedDepedEmail,
      deped_email: watchedDepedEmail
    }

    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .insert(newData)

      if (error) {
        void logError(
          'Reclassification application',
          'hrm_ranking_applicants',
          JSON.stringify(newData),
          error.message
        )

        throw new Error(error.message)
      }

      setIsSuccess(true)

      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSearch = async () => {
    setSearching(true)
    setDoneSearch(false)
    setApplicantExist(false)
    setEmailFound(false)
    setApplicantDetails(null)

    // search if user has existing active application
    const { data: existingApplicant } = await supabase
      .from('hrm_ranking_applicants')
      .select()
      .eq('email', watchedDepedEmail)
      .eq('type', 'Reclassification')
      .eq('status', 'Active')

    if (existingApplicant && existingApplicant.length > 0) {
      setSearching(false)
      setDoneSearch(true)
      setApplicantExist(true)
      return
    }

    const { data } = await supabase
      .from('hrm_users')
      .select()
      .eq('email', watchedDepedEmail)
      .maybeSingle()
    if (data) {
      setEmailFound(true)
      setApplicantDetails(data)
    }

    setSearching(false)
    setDoneSearch(true)
  }

  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="bg-gray-700 h-full pb-10 pt-32 px-6 flex items-start justify-center">
        <div className="bg-gray-100 p-4 mb-20 rounded-lg border w-full md:w-[720px]">
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
                  <div className="w-full">
                    <div className="app__label_standard">
                      Please type your DepEd email and click "Get Details"
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
                        title={searching ? 'Searching...' : 'Get Details'}
                        isDisabled={searching}
                        btnType="button"
                        handleClick={handleSearch}
                      />
                    </div>
                  </div>
                  {!emailFound && !applicantExist && doneSearch && (
                    <div className="text-red-500 text-sm font-medium">
                      No matching records found.
                    </div>
                  )}
                  {applicantExist && doneSearch && (
                    <div className="text-red-500 text-sm font-medium">
                      This employee currently have active reclassification
                      application.
                    </div>
                  )}
                </div>

                {searching && <TwoColTableLoading />}
                {!searching && applicantDetails && (
                  <div className="grid gap-4">
                    <div>
                      <div className="app__label_standard">Applicant Name:</div>
                      <div className="app__label_value">
                        <UserBlock user={applicantDetails} />
                      </div>
                    </div>
                  </div>
                )}

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
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
export default Page
