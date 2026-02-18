'use client'

import { CustomButton } from '@/components/index'
import type { SignatoriesTypes } from '@/types'
import { useForm } from 'react-hook-form'

interface BulkNosaFormData extends SignatoriesTypes {
  effective_date: string
  lastname_letter: string
}

interface BulkNosaModalProps {
  hideModal: () => void
  modalData: (data: {
    signatories: SignatoriesTypes
    effectiveDate: string
    lastnameLetter: string
  }) => void
}

const LASTNAME_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function SignatoryField({
  label,
  nameKey,
  positionKey,
  register,
  errors
}: {
  label: string
  nameKey: 'truly_yours' | 'recommending_1' | 'recommending_2' | 'approval'
  positionKey:
    | 'truly_yours_position'
    | 'recommending_1_position'
    | 'recommending_2_position'
    | 'approval_position'
  register: any
  errors: any
}) {
  return (
    <div className="app__form_field_container">
      <div className="w-full">
        <div className="app__label_standard">{label}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <input
              {...register(nameKey, { required: true })}
              placeholder="Name"
              className="app__input_standard"
              aria-invalid={!!errors[nameKey]}
            />
            {errors[nameKey] && (
              <div className="app__error_message">Name is required</div>
            )}
          </div>
          <div>
            <input
              {...register(positionKey, { required: true })}
              placeholder="Position"
              className="app__input_standard"
              aria-invalid={!!errors[positionKey]}
            />
            {errors[positionKey] && (
              <div className="app__error_message">Position is required</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const BulkNosaModal = ({ hideModal, modalData }: BulkNosaModalProps) => {
  const {
    register,
    formState: { errors },
    handleSubmit
  } = useForm<BulkNosaFormData>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: BulkNosaFormData) => {
    const signatories: SignatoriesTypes = {
      first_paragraph: formdata.first_paragraph,
      truly_yours: formdata.truly_yours,
      truly_yours_position: formdata.truly_yours_position,
      recommending_1: formdata.recommending_1,
      recommending_1_position: formdata.recommending_1_position,
      recommending_2: formdata.recommending_2,
      recommending_2_position: formdata.recommending_2_position,
      approval: formdata.approval,
      approval_position: formdata.approval_position
    }
    const letter = formdata.lastname_letter.trim().toUpperCase().charAt(0)
    hideModal()
    modalData({
      signatories,
      effectiveDate: formdata.effective_date,
      lastnameLetter: letter
    })
  }

  return (
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Bulk NOSA — Print Settings & Signatories
            </h5>
            <CustomButton
              containerStyles="app__btn_gray"
              title="Close"
              btnType="button"
              handleClick={hideModal}
            />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            {/* Print settings section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                Print settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Effective date</div>
                    <input
                      type="date"
                      {...register('effective_date', { required: true })}
                      className="app__input_standard"
                      aria-invalid={!!errors.effective_date}
                    />
                    {errors.effective_date && (
                      <div className="app__error_message">This is required</div>
                    )}
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      Lastname starting letter
                    </div>
                    <select
                      {...register('lastname_letter', { required: true })}
                      className="app__input_standard"
                      aria-invalid={!!errors.lastname_letter}
                    >
                      <option value="">Select letter</option>
                      {LASTNAME_LETTERS.map((letter) => (
                        <option key={letter} value={letter}>
                          {letter}
                        </option>
                      ))}
                    </select>
                    {errors.lastname_letter && (
                      <div className="app__error_message">This is required</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Signatories section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                Signatories
              </h3>
              <div className="space-y-4">
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">First paragraph</div>
                    <textarea
                      {...register('first_paragraph', { required: true })}
                      placeholder="e.g. Please be informed that effective…"
                      className="app__input_standard min-h-[80px] resize-y"
                      rows={3}
                      aria-invalid={!!errors.first_paragraph}
                    />
                    {errors.first_paragraph && (
                      <div className="app__error_message">This is required</div>
                    )}
                  </div>
                </div>

                <SignatoryField
                  label="Very truly yours"
                  nameKey="truly_yours"
                  positionKey="truly_yours_position"
                  register={register}
                  errors={errors}
                />
                <SignatoryField
                  label="Recommending approval (1)"
                  nameKey="recommending_1"
                  positionKey="recommending_1_position"
                  register={register}
                  errors={errors}
                />
                <SignatoryField
                  label="Recommending approval (2)"
                  nameKey="recommending_2"
                  positionKey="recommending_2_position"
                  register={register}
                  errors={errors}
                />
                <SignatoryField
                  label="Approved by"
                  nameKey="approval"
                  positionKey="approval_position"
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            <div className="app__modal_footer mt-6 pt-4 border-t border-gray-200">
              <button type="submit" className="app__btn_green_sm">
                Print
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BulkNosaModal
