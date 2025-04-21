import { CustomButton } from '@/components/index'
import ApplicantCommitteePoints from '@/components/Rsp/ApplicantCommitteePoints'
import { ApplicantTypes } from '@/types'

interface ModalProps {
  hideModal: () => void
  applicantData: ApplicantTypes
}

const CommitteePointsModal = ({ hideModal, applicantData }: ModalProps) => {
  //
  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Casted Points</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>
            <div className="app__modal_body">
              <ApplicantCommitteePoints applicantData={applicantData} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CommitteePointsModal
