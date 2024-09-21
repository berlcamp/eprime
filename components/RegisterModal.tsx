'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import {
  fetchDistricts,
  fetchOffices,
  fetchSchools,
  logError
} from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import uuid from 'react-uuid'

import { CustomButton, OneColLayoutLoading } from '@/components'
import type { DistrictTypes, Office, SchoolTypes } from '@/types'

interface ModalProps {
  hideModal: () => void
}

interface FormValues {
  firstname: string
  middlename: string
  lastname: string
  gender: string
  email: string
  password: string
  confirm_password: string
  assignment: string
  school_id?: string
  district_id?: string
  office_id?: string
}

const RegisterModal = ({ hideModal }: ModalProps) => {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [assignment, setAssignment] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [schools, setSchools] = useState<SchoolTypes[] | null>(null)
  const [districts, setDistricts] = useState<DistrictTypes[] | null>(null)
  const [offices, setOffices] = useState<Office[] | null>(null)

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<FormValues>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: FormValues) => {
    if (loading) return

    await handleSignup(formdata)
  }

  const handleSignup = async (formdata: FormValues) => {
    if (loading) return

    if (formdata.password !== formdata.confirm_password) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    // Check if the email domain is allowed
    const allowedDomains = ['deped.gov.ph']
    const emailDomain = formdata.email.split('@')[1]
    if (!allowedDomains.includes(emailDomain)) {
      setError('We only allow DepEd email address')
      setLoading(false)
      return false
    }

    try {
      const {
        count,
        data: existingUser,
        error: hrmUsersError
      } = await supabase
        .from('hrm_registrations')
        .select('*', { count: 'exact' })
        .eq('email', formdata.email)

      if (hrmUsersError) throw new Error(hrmUsersError.message)

      if (count > 0) {
        if (existingUser[0].status === 'Active') {
          setError('This email already registered')
          throw new Error('This email already registered.')
        } else {
          setError(
            'This email already registered and is subject for verification from admin'
          )
          throw new Error(
            'This email already registered and is subject for verification from admin.'
          )
        }
      } else {
        const district =
          formdata.assignment === 'school' ? Number(formdata.district_id) : null
        const school =
          formdata.assignment === 'school' ? Number(formdata.school_id) : null
        const office =
          formdata.assignment === 'office' ? Number(formdata.office_id) : null

        const newUserData = {
          firstname: formdata.firstname,
          middlename: formdata.middlename,
          lastname: formdata.lastname,
          gender: formdata.gender,
          email: formdata.email,
          password: formdata.password,
          assignment: formdata.assignment,
          district_id: district,
          school_id: school,
          office_id: office,
          status: 'For Approval',
          org_id: process.env.NEXT_PUBLIC_ORG_ID
        }

        const { data, error: registrationError } = await supabase
          .from('hrm_registrations')
          .insert(newUserData)
          .select()

        if (registrationError) {
          void logError(
            'Registration',
            'hrm_registrations',
            JSON.stringify(newUserData),
            registrationError.message
          )
          setError(
            'Registration failed this time, please reload the page and try again.'
          )
          throw new Error(registrationError.message)
        }

        const fullname = `${formdata.firstname} ${formdata.middlename} ${formdata.lastname}`
        void handleNotify(fullname, data[0].id)

        setComplete(true)
      }

      setLoading(false)
      setError(null)
    } catch (error) {
      setLoading(false)
    }
  }

  const handleNotify = async (fullname: string, id: string) => {
    //
    try {
      const userIds: string[] = []

      // Approvers
      const { data, error } = await supabase
        .from('hrm_system_access')
        .select('user_id')
        .eq('type', 'employee_accounts')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error) {
        throw new Error(error.message)
      }

      data.forEach((item: any) => {
        userIds.push(item.user_id)
      })

      const notificationData: any[] = []

      userIds.forEach((userId) => {
        notificationData.push({
          message: `${fullname} has recently registered. Kindly review and approve his registration.`,
          url: '/registrations',
          type: 'New Registration',
          user_id: userId,
          registration_id: id,
          reference_table: 'hrm_registrations'
        })
      })

      if (notificationData.length > 0) {
        // insert to notifications
        const { error: error3 } = await supabase
          .from('hrm_notifications')
          .insert(notificationData)

        if (error3) {
          throw new Error(error3.message)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrict(districtId)
    setLoadingSchools(true)

    const result = await fetchSchools({ filterDistrictId: districtId }, 300, 0)

    setSchools(result.data.length > 0 ? result.data : null)
    setLoadingSchools(false)
  }

  useEffect(() => {
    reset({})

    setComplete(false)

    const fetchDistrictsData = async () => {
      const result = await fetchDistricts('', 300, 0)
      setDistricts(result.data.length > 0 ? result.data : null)
    }

    const fetchOfficesData = async () => {
      const result = await fetchOffices('', 300, 0)
      setOffices(result.data.length > 0 ? result.data : null)
    }

    void fetchDistrictsData()
    void fetchOfficesData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Sign Up</h5>
              <button
                disabled={loading}
                onClick={hideModal}
                type="button"
                className="app__modal_header_btn"
              >
                &times;
              </button>
            </div>

            {!complete && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="app__modal_body"
              >
                {error &&
                  error !== 'This email already exist.' &&
                  error !==
                    'This email already registered and is subject for verification from admin.' && (
                    <div className="app__error_message pb-4">{error}</div>
                  )}
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">First Name</div>
                    <div>
                      <input
                        {...register('firstname', { required: true })}
                        type="text"
                        placeholder="First Name"
                        className="app__input_standard"
                      />
                      {errors.firstname && (
                        <div className="app__error_message">
                          First Name is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Middle Name</div>
                    <div>
                      <input
                        {...register('middlename')}
                        type="text"
                        placeholder="Middle Name"
                        className="app__input_standard"
                      />
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Last Name</div>
                    <div>
                      <input
                        {...register('lastname', { required: true })}
                        type="text"
                        placeholder="Last Name"
                        className="app__input_standard"
                      />
                      {errors.lastname && (
                        <div className="app__error_message">
                          Last Name is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Gender</div>
                    <div>
                      <select
                        {...register('gender', { required: true })}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {errors.gender && (
                        <div className="app__error_message">
                          Gender is required
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
                        {...register('email', { required: true })}
                        type="email"
                        placeholder="Your DepEd email address"
                        onChange={() => setError('')}
                        className="app__input_standard"
                      />
                      {errors.email && (
                        <div className="app__error_message">
                          Email is required
                        </div>
                      )}
                      {error &&
                        (error === 'This email already exist.' ||
                          error ===
                            'This email already registered and is subject for verification from admin.') && (
                          <div className="app__error_message pb-4">{error}</div>
                        )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Password</div>
                    <div>
                      <input
                        {...register('password', { required: true })}
                        type="password"
                        className="app__input_standard"
                      />
                      {errors.password && (
                        <div className="app__error_message">
                          Password is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Re-type Password</div>
                    <div>
                      <input
                        {...register('confirm_password', { required: true })}
                        type="password"
                        className="app__input_standard"
                      />
                      {errors.confirm_password && (
                        <div className="app__error_message">
                          Confirm Password is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      Original assignment
                    </div>
                    <div>
                      <select
                        {...register('assignment', { required: true })}
                        value={assignment}
                        onChange={(e) => setAssignment(e.target.value)}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="school">School</option>
                        <option value="office">Division Office</option>
                      </select>
                      {errors.assignment && (
                        <div className="app__error_message">
                          Assignment is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {assignment === 'school' && (
                  <>
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">
                          Choose district
                        </div>
                        <div>
                          <select
                            {...register('district_id', { required: true })}
                            onChange={async (e) =>
                              await handleDistrictChange(e.target.value)
                            }
                            value={selectedDistrict}
                            className="app__select_standard"
                          >
                            <option value="">Choose</option>
                            {districts?.map((item) => (
                              <option key={uuid()} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          {errors.district_id && (
                            <div className="app__error_message">
                              District is required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {loadingSchools && (
                  <div className="">
                    <OneColLayoutLoading rows={1} />
                  </div>
                )}
                {assignment === 'school' && !loadingSchools && (
                  <>
                    <div className="app__form_field_container">
                      <div className="w-full">
                        <div className="app__label_standard">Choose School</div>
                        <div>
                          <select
                            {...register('school_id', { required: true })}
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value)}
                            className="app__select_standard"
                          >
                            <option value="">Choose</option>
                            {schools?.map((item) => (
                              <option key={uuid()} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          {errors.school_id && (
                            <div className="app__error_message">
                              School is required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {assignment === 'office' && (
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Choose office?</div>
                      <div>
                        <select
                          {...register('office_id', { required: true })}
                          value={selectedOffice}
                          onChange={(e) => setSelectedOffice(e.target.value)}
                          className="app__select_standard"
                        >
                          <option value="">Choose</option>
                          {offices?.map((item) => (
                            <option key={uuid()} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        {errors.office_id && (
                          <div className="app__error_message">
                            Office is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="app__modal_footer">
                  <CustomButton
                    btnType="submit"
                    isDisabled={loading}
                    containerStyles="app__btn_green_sm"
                    title={loading ? 'Saving..' : 'Submit'}
                  />
                </div>
              </form>
            )}
            {complete && (
              <div className="m-4 p-4 bg-gray-200 rounded-lg border">
                <span className="font-bold text-green-600">
                  Registration Successfull.
                </span>{' '}
                Please wait for the administrator to verify your account. Once
                approved, you will received an email notification.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default RegisterModal
