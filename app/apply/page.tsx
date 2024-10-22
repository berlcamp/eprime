'use client'
import { TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicationTypes, RankingTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

const Page: React.FC = () => {
  const [saving, setSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [ranking, setRanking] = useState<RankingTypes | null>(null)
  const searchParams = useSearchParams()
  const { supabase, session } = useSupabase()

  const ranking_id = searchParams.get('ref')

  const {
    register,
    formState: { errors },
    watch,
    handleSubmit
  } = useForm<ApplicationTypes>({
    mode: 'onSubmit'
  })

  const watchedType = watch('type')

  const onSubmit = async (formdata: ApplicationTypes) => {
    if (saving) return

    setSaving(true)

    void handleCreate(formdata)
  }

  const handleCreate = async (formdata: ApplicationTypes) => {
    const newData = {
      ranking_id,
      type: formdata.type,
      item_number: formdata.item_number,
      lastname: formdata.lastname,
      firstname: formdata.firstname,
      middlename: formdata.middlename
    }

    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .insert(newData)

      if (error) {
        void logError(
          'Ranking application',
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

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('hrm_rankings')
        .select('*, position:position_id(name)')
        .eq('id', ranking_id)
        .single()

      if (data) {
        setRanking(data)
      }
    }
    void fetchData()
  }, [])
  return (
    <div className="app__home">
      <TopBarDark isGuest={session ? false : true} />
      <div className="bg-gray-700 h-screen pb-10 pt-32 px-6 flex items-start justify-center">
        {ranking && (
          <div className="bg-gray-100 p-4 rounded-lg border w-full md:w-[720px]">
            {isSuccess && (
              <div className="text-green-700">
                Application successfully submitted.
              </div>
            )}
            {!isSuccess && (
              <>
                <div>
                  Apply for{' '}
                  <span className="font-bold">{ranking.position.name}</span>
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
                            value="For Promotion"
                            {...register('type', { required: true })}
                          />
                          <span>For Promotion</span>
                        </label>

                        {errors.type && (
                          <div className="app__error_message">
                            Type of applicant is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {watchedType === 'New Applicant' && (
                    <>
                      <div className="app__form_field_container mt-4">
                        <div className="w-full">
                          <div className="app__label_standard">Firstname</div>
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
                          <div className="app__label_standard">Middlename</div>
                          <div>
                            <input
                              {...register('middlename', { required: true })}
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
                          <div className="app__label_standard">Lastname</div>
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
                    </>
                  )}
                  {watchedType === 'For Promotion' && (
                    <>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Type your Item No.{' '}
                            <span className="italic text-xs">
                              (Do not add space or symbols)
                            </span>
                          </div>
                          <div>
                            <input
                              {...register('item_number', { required: true })}
                              className="app__input_standard"
                            />
                            {errors.item_number && (
                              <div className="app__error_message">
                                Item number is required
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <hr className="my-6" />
                  {watchedType && (
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
                          {saving ? 'Saving..' : 'Save'}
                        </button>
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
