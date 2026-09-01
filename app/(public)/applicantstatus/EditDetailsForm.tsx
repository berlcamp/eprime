'use client'
import { CustomButton } from '@/components/index'
import { elementaryMajors, jhsMajors, shsMajors } from '@/constants'
import { type ApplicantTypes } from '@/types'
import axios from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface EditDetailsFormProps {
  applicant: ApplicantTypes
  code: string
  onCancel: () => void
  onSaved: () => void
}

/**
 * The same personal-detail fields the applicant filled in on /apply, so a typo
 * or a changed contact number can be fixed without going through HR. The write
 * goes to /api/applicantdetails because the anon role has no update grant on
 * hrm_ranking_applicants.
 */
const EditDetailsForm: React.FC<EditDetailsFormProps> = ({
  applicant,
  code,
  onCancel,
  onSaved
}) => {
  // This page is public, so there is no FilterProvider and no <Toaster />
  // mounted: feedback has to be rendered inline.
  const [saveError, setSaveError] = useState('')

  const majorOptions = (() => {
    switch (applicant.ranking?.department) {
      case 'Elementary':
        return elementaryMajors
      case 'Junior High School':
        return jhsMajors
      case 'Senior High School':
        return shsMajors
      case 'Secondary':
        return [...jhsMajors, ...shsMajors]
      default:
        return []
    }
  })()

  // `specific_major` is stored as free text once "Others" was picked, so an
  // existing value that is not in the list has to reopen the "Others" input.
  const storedMajorIsListed =
    !applicant.specific_major || majorOptions.includes(applicant.specific_major)

  const {
    register,
    formState: { errors, isSubmitting },
    watch,
    handleSubmit
  } = useForm<ApplicantTypes>({
    mode: 'onSubmit',
    defaultValues: {
      firstname: applicant.firstname ?? '',
      middlename: applicant.middlename ?? '',
      lastname: applicant.lastname ?? '',
      email: applicant.email ?? '',
      address: applicant.address ?? '',
      age: applicant.age ?? '',
      sex: applicant.sex ?? '',
      civil_status: applicant.civil_status ?? '',
      religion: applicant.religion ?? '',
      disability: applicant.disability ?? '',
      ethnicity: applicant.ethnicity ?? '',
      ethnicity_detail: applicant.ethnicity_detail ?? '',
      latin_honor_yesno: applicant.latin_honor ? 'Yes' : 'No',
      latin_honor: applicant.latin_honor ?? '',
      special_program_beneficiary_yesno: applicant.special_program_beneficiary
        ? 'Yes'
        : 'No',
      special_program_beneficiary: applicant.special_program_beneficiary ?? '',
      special_skills: applicant.special_skills ?? '',
      solo_parent: applicant.solo_parent ?? '',
      solo_parent_detail: applicant.solo_parent_detail ?? '',
      contact_number: applicant.contact_number ?? '',
      specific_major: storedMajorIsListed ? applicant.specific_major : 'Others',
      specific_major_other: storedMajorIsListed ? '' : applicant.specific_major
    }
  })

  const onSubmit = async (formdata: ApplicantTypes) => {
    if (isSubmitting) return

    setSaveError('')

    const details = {
      firstname: formdata.firstname,
      middlename: formdata.middlename,
      lastname: formdata.lastname,
      email: formdata.email,
      address: formdata.address,
      age: formdata.age,
      sex: formdata.sex,
      civil_status: formdata.civil_status,
      religion: formdata.religion,
      disability: formdata.disability,
      ethnicity: formdata.ethnicity,
      ethnicity_detail:
        formdata.ethnicity === 'Yes' ? formdata.ethnicity_detail : '',
      latin_honor:
        formdata.latin_honor_yesno === 'Yes' ? formdata.latin_honor : '',
      special_program_beneficiary:
        formdata.special_program_beneficiary_yesno === 'Yes'
          ? formdata.special_program_beneficiary
          : '',
      special_skills: formdata.special_skills,
      solo_parent: formdata.solo_parent,
      solo_parent_detail: formdata.solo_parent_detail,
      contact_number: formdata.contact_number,
      ...(applicant.ranking?.department !== 'Non-Teaching' && {
        specific_major:
          formdata.specific_major === 'Others'
            ? formdata.specific_major_other?.trim()
            : formdata.specific_major
      })
    }

    try {
      await axios.post('/api/applicantdetails', { code, details })
      onSaved()
    } catch (error) {
      setSaveError(
        axios.isAxiosError(error) && error.response?.data?.error
          ? (error.response.data.error as string)
          : 'Could not save your details. Please try again.'
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-gray-50 border">
      <div className="text-center text-sm mb-2">MY DETAILS</div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Firstname</div>
          <input
            {...register('firstname', { required: 'Firstname is required' })}
            className="app__input_standard"
          />
          {errors.firstname && (
            <div className="app__error_message">{errors.firstname.message}</div>
          )}
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Middlename</div>
          <input
            {...register('middlename')}
            className="app__input_standard"
          />
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Lastname</div>
          <input
            {...register('lastname', { required: 'Lastname is required' })}
            className="app__input_standard"
          />
          {errors.lastname && (
            <div className="app__error_message">{errors.lastname.message}</div>
          )}
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Email</div>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="app__input_standard"
          />
          {errors.email && (
            <div className="app__error_message">{errors.email.message}</div>
          )}
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Address</div>
          <input
            {...register('address', { required: 'Address is required' })}
            className="app__input_standard"
          />
          {errors.address && (
            <div className="app__error_message">{errors.address.message}</div>
          )}
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Age</div>
          <input
            type="number"
            {...register('age', { required: 'Age is required', min: 1 })}
            className="app__input_standard"
          />
          {errors.age && (
            <div className="app__error_message">{errors.age.message}</div>
          )}
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Sex</div>
          <select
            {...register('sex', { required: 'Sex is required' })}
            className="app__input_standard"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.sex && (
            <div className="app__error_message">{errors.sex.message}</div>
          )}
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Civil Status</div>
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

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Religion</div>
          <input
            {...register('religion', { required: 'Religion is required' })}
            className="app__input_standard"
          />
          {errors.religion && (
            <div className="app__error_message">{errors.religion.message}</div>
          )}
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Disability</div>
          <input {...register('disability')} className="app__input_standard" />
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Member of Ethnic Group?</div>
          <div>
            <label>
              <input type="radio" value="Yes" {...register('ethnicity')} /> Yes
            </label>
            <label className="ml-4">
              <input type="radio" value="No" {...register('ethnicity')} /> No
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

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">With Latin Honor?</div>
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

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">
            Special Program Beneficiary? (4ps, SPIMS, DOST)
          </div>
          <div>
            <label>
              <input
                type="radio"
                value="Yes"
                {...register('special_program_beneficiary_yesno')}
              />{' '}
              Yes
            </label>
            <label className="ml-4">
              <input
                type="radio"
                value="No"
                {...register('special_program_beneficiary_yesno')}
              />{' '}
              No
            </label>
            {watch('special_program_beneficiary_yesno') === 'Yes' && (
              <input
                {...register('special_program_beneficiary')}
                placeholder="Special Program Beneficiary"
                className="app__input_standard mt-2"
              />
            )}
          </div>
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Special Skills:</div>
          <input
            {...register('special_skills')}
            placeholder="Special Skills"
            className="app__input_standard"
          />
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Solo Parent</div>
          <div>
            <label>
              <input type="radio" value="Yes" {...register('solo_parent')} /> Yes
            </label>
            <label className="ml-4">
              <input type="radio" value="No" {...register('solo_parent')} /> No
            </label>
          </div>
        </div>
      </div>

      <div className="app__form_field_container">
        <div className="w-full">
          <div className="app__label_standard">Contact Number</div>
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

      {applicant.ranking?.department !== 'Non-Teaching' && (
        <div className="app__form_field_container">
          <div className="w-full">
            <div className="app__label_standard">Specific Major</div>
            <select
              {...register('specific_major', {
                required: 'Please select a specific major'
              })}
              className="app__input_standard"
            >
              <option value="">-- Select Specific Major --</option>
              {majorOptions.map((specific_major) => (
                <option key={specific_major} value={specific_major}>
                  {specific_major}
                </option>
              ))}
              <option value="Others">Others</option>
            </select>
            {errors.specific_major && (
              <span className="app__error_message">
                {errors.specific_major.message}
              </span>
            )}
            {watch('specific_major') === 'Others' && (
              <div className="mt-2">
                <input
                  {...register('specific_major_other', {
                    validate: (value) =>
                      value?.trim() ? true : 'Please specify your major'
                  })}
                  placeholder="Please specify your major"
                  className="app__input_standard"
                />
                {errors.specific_major_other && (
                  <span className="app__error_message">
                    {errors.specific_major_other.message}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {Object.values(errors).length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mt-4 text-sm">
          Some fields have errors, please check above
        </div>
      )}

      {saveError !== '' && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mt-4 text-sm">
          {saveError}
        </div>
      )}

      <div className="app__modal_footer">
        <CustomButton
          btnType="submit"
          isDisabled={isSubmitting}
          title={isSubmitting ? 'Saving...' : 'Save Details'}
          containerStyles="app__btn_green"
        />
        <CustomButton
          btnType="button"
          isDisabled={isSubmitting}
          title="Cancel"
          handleClick={onCancel}
          containerStyles="app__btn_gray"
        />
      </div>
    </form>
  )
}

export default EditDetailsForm
