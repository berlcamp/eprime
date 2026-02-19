import { CustomButton } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { ApplicantTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface PropTypes {
  documentData: ApplicantTypes
}
export default function EquivalentUnits({ documentData }: PropTypes) {
  const [saving, setSaving] = useState(false)
  const { setToast, hasAccess } = useFilter()
  const { supabase } = useSupabase()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<ApplicantTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: ApplicantTypes) => {
    setSaving(true)

    const newData = {
      professional_study_units: formdata.professional_study_units,
      teaching_public_school_units: formdata.teaching_public_school_units,
      teaching_private_school_units: formdata.teaching_private_school_units,
      supervisory_public_school_units: formdata.supervisory_public_school_units,
      supervisory_private_school_units:
        formdata.supervisory_private_school_units,
      seminars_units: formdata.seminars_units
    }

    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError(
          'Update Equivalent Units',
          'hrm_ranking_applicants',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the `page and try again.'
        )
        throw new Error(error.message)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    reset({
      professional_study_units: documentData.professional_study_units,
      teaching_public_school_units: documentData.teaching_public_school_units,
      teaching_private_school_units: documentData.teaching_private_school_units,
      supervisory_public_school_units:
        documentData.supervisory_public_school_units,
      supervisory_private_school_units:
        documentData.supervisory_private_school_units,
      seminars_units: documentData.seminars_units
    })
  }, [reset])

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
        <table className="w-full">
          <thead>
            <tr>
              <th>Experienced</th>
              <th>Supporting Doc</th>
              <th>Equivalent Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td> 1. Professional Study</td>
              <td>
                {documentData.professional_study_file_path && (
                  <Link
                    href={`${documentData.professional_study_file_path}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {documentData.professional_study_file_path.slice(-20)}
                  </Link>
                )}
              </td>
              <td>
                {hasAccess('hr') ? (
                  <>
                    <input
                      {...register('professional_study_units', {
                        required: true,
                        min: {
                          value: 0,
                          message: 'Cannot be negative',
                        },
                      })}
                      type="number"
                      min={0}
                      step="any"
                      className="app__input_standard"
                    />
                    {errors.professional_study_units && (
                      <div className="app__error_message">
                        Equivalent Units is required
                      </div>
                    )}
                  </>
                ) : (
                  <>{documentData.professional_study_units}</>
                )}
              </td>
            </tr>
            <tr>
              <td> 2.1. Teaching Experienced (Public School)</td>
              <td>
                {documentData.teaching_public_school_file_path && (
                  <Link
                    href={`${documentData.teaching_public_school_file_path}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {documentData.teaching_public_school_file_path.slice(-20)}
                  </Link>
                )}
              </td>
              <td>
                {hasAccess('hr') ? (
                  <>
                    <input
                      {...register('teaching_public_school_units', {
                        required: true,
                        min: {
                          value: 0,
                          message: 'Cannot be negative',
                        },
                      })}
                      type="number"
                      min={0}
                      step="any"
                      className="app__input_standard"
                    />
                    {errors.teaching_public_school_units && (
                      <div className="app__error_message">
                        Equivalent Units is required
                      </div>
                    )}
                  </>
                ) : (
                  <>{documentData.teaching_public_school_units}</>
                )}
              </td>
            </tr>
            <tr>
              <td>2.2. Teaching Experienced (Private School)</td>
              <td>
                {documentData.teaching_private_school_file_path && (
                  <Link
                    href={`${documentData.teaching_private_school_file_path}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {documentData.teaching_private_school_file_path.slice(-20)}
                  </Link>
                )}
              </td>
              <td>
                {hasAccess('hr') ? (
                  <>
                    <input
                      {...register('teaching_private_school_units', {
                        required: true,
                        min: {
                          value: 0,
                          message: 'Cannot be negative',
                        },
                      })}
                      type="number"
                      min={0}
                      step="any"
                      className="app__input_standard"
                    />
                    {errors.teaching_private_school_units && (
                      <div className="app__error_message">
                        Equivalent Units is required
                      </div>
                    )}
                  </>
                ) : (
                  <>{documentData.teaching_private_school_units}</>
                )}
              </td>
            </tr>
            <tr>
              <td>3.1. Administrative Supervisory (Public School)</td>
              <td>
                {documentData.supervisory_public_school_file_path && (
                  <Link
                    href={`${documentData.supervisory_public_school_file_path}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {documentData.supervisory_public_school_file_path.slice(
                      -20
                    )}
                  </Link>
                )}
              </td>
              <td>
                {hasAccess('hr') ? (
                  <>
                    <input
                      {...register('supervisory_public_school_units', {
                        required: true,
                        min: {
                          value: 0,
                          message: 'Cannot be negative',
                        },
                      })}
                      type="number"
                      min={0}
                      step="any"
                      className="app__input_standard"
                    />
                    {errors.supervisory_public_school_units && (
                      <div className="app__error_message">
                        Equivalent Units is required
                      </div>
                    )}
                  </>
                ) : (
                  <>{documentData.supervisory_public_school_units}</>
                )}
              </td>
            </tr>
            <tr>
              <td>
                3.2. Administrative Supervisory Experienced (Private School)
              </td>
              <td>
                {documentData.supervisory_private_school_file_path && (
                  <Link
                    href={`${documentData.supervisory_private_school_file_path}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {documentData.supervisory_private_school_file_path.slice(
                      -20
                    )}
                  </Link>
                )}
              </td>
              <td>
                {hasAccess('hr') ? (
                  <>
                    <input
                      {...register('supervisory_private_school_units', {
                        required: true,
                        min: {
                          value: 0,
                          message: 'Cannot be negative',
                        },
                      })}
                      type="number"
                      min={0}
                      step="any"
                      className="app__input_standard"
                    />
                    {errors.supervisory_private_school_units && (
                      <div className="app__error_message">
                        Equivalent Units is required
                      </div>
                    )}
                  </>
                ) : (
                  <>{documentData.supervisory_private_school_units}</>
                )}
              </td>
            </tr>
            <tr>
              <td>4. Others(Seminars, Workshop, etc.)</td>
              <td>
                {documentData.seminars_file_path && (
                  <Link
                    href={`${documentData.seminars_file_path}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {documentData.seminars_file_path.slice(-20)}
                  </Link>
                )}
              </td>
              <td>
                {hasAccess('hr') ? (
                  <>
                    <input
                      {...register('seminars_units', {
                        required: true,
                        min: {
                          value: 0,
                          message: 'Cannot be negative',
                        },
                      })}
                      type="number"
                      min={0}
                      step="any"
                      className="app__input_standard"
                    />
                    {errors.seminars_units && (
                      <div className="app__error_message">
                        Equivalent Units is required
                      </div>
                    )}
                  </>
                ) : (
                  <>{documentData.seminars_units}</>
                )}
              </td>
            </tr>
            {hasAccess('hr') && (
              <tr>
                <td colSpan={3} className="text-right">
                  <CustomButton
                    btnType="submit"
                    isDisabled={saving}
                    title={saving ? 'Saving...' : 'Save'}
                    containerStyles="app__btn_green"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </form>
    </div>
  )
}
