import { CustomButton } from '@/components/index'

// Types
import type { Employee } from '@/types'

// Redux imports

interface ModalProps {
  hideModal: () => void
  list: Employee[]
}

const NamesModal = ({ hideModal, list }: ModalProps) => {
  //
  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Personnel</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              <div>
                <table className="app__table">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">#</th>
                      <th className="app__th">Name</th>
                      <th className="app__th">School</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list?.map((item, index) => (
                      <tr key={item.id} className="app__tr">
                        <td className="app__td">{index + 1}.</td>
                        <td className="app__td">
                          {item.lastname}, {item.firstname} {item.middlename}
                        </td>
                        <td className="app__td">{item.hrm_schools?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NamesModal
