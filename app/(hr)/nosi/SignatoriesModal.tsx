import { CustomButton } from '@/components'
import { SignatoriesTypes } from '@/types'
import { useForm } from 'react-hook-form'

// Types

// Redux imports

interface ModalProps {
  hideModal: () => void
  modalData: (signatories: SignatoriesTypes) => void
}

const SignatoriesModal = ({ hideModal, modalData }: ModalProps) => {
  const {
    register,
    formState: { errors },
    handleSubmit
  } = useForm<SignatoriesTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: SignatoriesTypes) => {
    const signatories = {
      truly_yours: formdata.truly_yours,
      truly_yours_position: formdata.truly_yours_position,
      recommending_1: formdata.recommending_1,
      recommending_1_position: formdata.recommending_1_position,
      recommending_2: formdata.recommending_2,
      recommending_2_position: formdata.recommending_2_position,
      approval: formdata.approval,
      approval_position: formdata.approval_position
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
                  <div className="app__label_standard">Very truly yours:</div>
                  <div className="flex space-x-1">
                    <input
                      {...register('truly_yours', { required: true })}
                      placeholder="Name"
                      className="app__input_standard"
                    />
                    <input
                      {...register('truly_yours_position', { required: true })}
                      placeholder="Position"
                      className="app__input_standard"
                    />
                  </div>
                  {errors.truly_yours && (
                    <div className="app__error_message">Name is required</div>
                  )}
                  {errors.truly_yours_position && (
                    <div className="app__error_message">
                      Position is required
                    </div>
                  )}
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Recommending Approval (1):
                  </div>
                  <div className="flex space-x-1">
                    <input
                      {...register('recommending_1', { required: true })}
                      placeholder="Name"
                      className="app__input_standard"
                    />
                    <input
                      {...register('recommending_1_position', {
                        required: true
                      })}
                      placeholder="Position"
                      className="app__input_standard"
                    />
                  </div>
                  {errors.recommending_1 && (
                    <div className="app__error_message">Name is required</div>
                  )}
                  {errors.recommending_1_position && (
                    <div className="app__error_message">
                      Position is required
                    </div>
                  )}
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Recommending Approval (2):
                  </div>
                  <div className="flex space-x-1">
                    <input
                      {...register('recommending_2', { required: true })}
                      placeholder="Name"
                      className="app__input_standard"
                    />
                    <input
                      {...register('recommending_2_position', {
                        required: true
                      })}
                      placeholder="Position"
                      className="app__input_standard"
                    />
                  </div>
                  {errors.recommending_2 && (
                    <div className="app__error_message">Name is required</div>
                  )}
                  {errors.recommending_2_position && (
                    <div className="app__error_message">
                      Position is required
                    </div>
                  )}
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Approved By:</div>
                  <div className="flex space-x-1">
                    <input
                      {...register('approval', { required: true })}
                      placeholder="Name"
                      className="app__input_standard"
                    />
                    <input
                      {...register('approval_position', {
                        required: true
                      })}
                      placeholder="Position"
                      className="app__input_standard"
                    />
                  </div>
                  {errors.approval && (
                    <div className="app__error_message">Name is required</div>
                  )}
                  {errors.approval_position && (
                    <div className="app__error_message">
                      Position is required
                    </div>
                  )}
                </div>
              </div>
              <div className="app__modal_footer">
                <button type="submit" className="app__btn_green_sm">
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
