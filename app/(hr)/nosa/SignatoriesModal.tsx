'use client'

import { CustomButton, SearchUserInput } from '@/components/index'
import type { Employee, SignatoriesTypes } from '@/types'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface ModalProps {
  hideModal: () => void
  modalData: (signatories: SignatoriesTypes) => void
}

function formatSignatoryName(emp: Employee) {
  return [emp.lastname, emp.firstname, emp.middlename].filter(Boolean).join(', ')
}

const SignatoriesModal = ({ hideModal, modalData }: ModalProps) => {
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
  } = useForm<Pick<SignatoriesTypes, 'first_paragraph'>>({
    mode: 'onSubmit'
  })

  const onSubmit = async (
    formdata: Pick<SignatoriesTypes, 'first_paragraph'>
  ) => {
    if (!trulyYoursUser || !recommending1User || !approvalUser) {
      return
    }
    const signatories: SignatoriesTypes = {
      first_paragraph: formdata.first_paragraph ?? '',
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
    hideModal()
    modalData(signatories)
  }

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Signatories Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">First paragraph:</div>
                  <div className="flex space-x-1">
                    <textarea
                      {...register('first_paragraph', { required: true })}
                      placeholder="First paragraph"
                      className="app__input_standard"
                    />
                  </div>
                  {errors.first_paragraph && (
                    <div className="app__error_message">This is required</div>
                  )}
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Very truly yours:</div>
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
                    Recommending Approval (1):
                  </div>
                  <SearchUserInput
                    isMultiple={false}
                    handleSelectedUsers={(users) =>
                      setRecommending1User(users[0] ?? null)
                    }
                    selectedUsers={recommending1User ? [recommending1User] : []}
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
                    Recommending Approval (2):{' '}
                    <span className="font-normal text-gray-500">
                      (optional)
                    </span>
                  </div>
                  <SearchUserInput
                    isMultiple={false}
                    handleSelectedUsers={(users) =>
                      setRecommending2User(users[0] ?? null)
                    }
                    selectedUsers={recommending2User ? [recommending2User] : []}
                  />
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Approved By:</div>
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
              <div className="app__modal_footer">
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
    </>
  )
}

export default SignatoriesModal
