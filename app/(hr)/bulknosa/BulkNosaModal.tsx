'use client'

import { CustomButton, SearchUserInput } from '@/components/index'
import type { Employee, SignatoriesTypes } from '@/types'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface BulkNosaFormData {
  first_paragraph: string
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

function formatSignatoryName(emp: Employee) {
  return [emp.lastname, emp.firstname, emp.middlename].filter(Boolean).join(', ')
}

const BulkNosaModal = ({ hideModal, modalData }: BulkNosaModalProps) => {
  const [trulyYoursUser, setTrulyYoursUser] = useState<Employee | null>(null)
  const [recommending1User, setRecommending1User] = useState<Employee | null>(
    null
  )
  const [recommending2User, setRecommending2User] = useState<Employee | null>(
    null
  )
  const [approvalUser, setApprovalUser] = useState<Employee | null>(null)

  const {
    register,
    formState: { errors },
    handleSubmit
  } = useForm<BulkNosaFormData>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: BulkNosaFormData) => {
    if (!trulyYoursUser || !recommending1User || !approvalUser) {
      return
    }
    const signatories: SignatoriesTypes = {
      first_paragraph: formdata.first_paragraph,
      truly_yours: formatSignatoryName(trulyYoursUser),
      truly_yours_position: trulyYoursUser.hrm_positions?.name ?? '',
      truly_yours_user: trulyYoursUser,
      recommending_1: formatSignatoryName(recommending1User),
      recommending_1_position: recommending1User.hrm_positions?.name ?? '',
      recommending_1_user: recommending1User,
      ...(recommending2User
        ? {
            recommending_2: formatSignatoryName(recommending2User),
            recommending_2_position:
              recommending2User.hrm_positions?.name ?? '',
            recommending_2_user: recommending2User
          }
        : {}),
      approval: formatSignatoryName(approvalUser),
      approval_position: approvalUser.hrm_positions?.name ?? '',
      approval_user: approvalUser
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

                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Very truly yours</div>
                    <SearchUserInput
                      isMultiple={false}
                      handleSelectedUsers={(users) =>
                        setTrulyYoursUser(users[0] ?? null)
                      }
                      selectedUsers={trulyYoursUser ? [trulyYoursUser] : []}
                    />
                    {!trulyYoursUser && (
                      <div className="app__error_message mt-1">
                        Select a signatory
                      </div>
                    )}
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      Recommending approval (1)
                    </div>
                    <SearchUserInput
                      isMultiple={false}
                      handleSelectedUsers={(users) =>
                        setRecommending1User(users[0] ?? null)
                      }
                      selectedUsers={
                        recommending1User ? [recommending1User] : []
                      }
                    />
                    {!recommending1User && (
                      <div className="app__error_message mt-1">
                        Select a signatory
                      </div>
                    )}
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      Recommending approval (2){' '}
                      <span className="font-normal text-gray-500">
                        (optional)
                      </span>
                    </div>
                    <SearchUserInput
                      isMultiple={false}
                      handleSelectedUsers={(users) =>
                        setRecommending2User(users[0] ?? null)
                      }
                      selectedUsers={
                        recommending2User ? [recommending2User] : []
                      }
                    />
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Approved by</div>
                    <SearchUserInput
                      isMultiple={false}
                      handleSelectedUsers={(users) =>
                        setApprovalUser(users[0] ?? null)
                      }
                      selectedUsers={approvalUser ? [approvalUser] : []}
                    />
                    {!approvalUser && (
                      <div className="app__error_message mt-1">
                        Select a signatory
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="app__modal_footer mt-6 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="app__btn_green_sm"
                disabled={
                  !trulyYoursUser || !recommending1User || !approvalUser
                }
              >
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
