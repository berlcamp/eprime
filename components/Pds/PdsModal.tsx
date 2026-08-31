'use client'
import CustomButton from '../CustomButton'
import Pds from './Pds'

interface ModalProps {
  hideModal: () => void
  userId: string
}

const PdsModal = ({ hideModal, userId }: ModalProps) => {
  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_extralarge">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Personal Data Sheet
              </h5>
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
            </div>

            {/* Modal Content */}
            <div className='relative overflow-x-scroll'>
              <Pds userId={userId}/>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PdsModal
