import { CustomButton } from '@/components'
import ApplicantAccumulatedPoints from '@/components/Rsp/ApplicantAccumulatedPoints'
import ApplicantDetails from '@/components/Rsp/ApplicantDetails'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes } from '@/types'
import { useEffect, useState } from 'react'
import CommitteePointsModal from './CommitteePointsModal'

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

const RankingApplicants = ({ hideModal, rankingId }: ModalProps) => {
  const [showQualificationsModal, setShowQualificationsModal] = useState(false)
  const [showCommitteePointsModal, setShowCommitteePointsModal] =
    useState(false)

  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null)

  const [list, setList] = useState<ApplicantTypes[] | []>([])
  const { supabase } = useSupabase()

  const handleViewQualifications = (item: ApplicantTypes) => {
    setShowQualificationsModal(true)
    setSelectedItem(item)
  }

  const handleViewCommitteePoints = (item: ApplicantTypes) => {
    setShowCommitteePointsModal(true)
    setSelectedItem(item)
  }

  useEffect(() => {
    const fetchApplicantsData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_applicants')
        .select()
        .eq('ranking_id', rankingId)
        .order('lastname', { assending: true })
      setList(data)
    }

    void fetchApplicantsData()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Applicants</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">Applicant</th>
                    <th className="app__th">Accumulated Points</th>
                    <th className="app__th"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.length > 0 &&
                    list.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <th className="app__th_firstcol">
                          <div className="font-medium">
                            {item.lastname}, {item.firstname} {item.middlename}
                          </div>
                          <div className="font-light">{item.email}</div>
                          {item.current_employee === 'Yes' && (
                            <div className="font-bold">
                              (Current DepEd Employee)
                            </div>
                          )}
                          {item.previous_applicant === 'Yes' && (
                            <div className="font-bold">
                              (Previous Applicant)
                            </div>
                          )}
                        </th>

                        <td>
                          <ApplicantAccumulatedPoints applicantData={item} />
                        </td>
                        <td className="app__td">
                          <div className="space-x-2">
                            <CustomButton
                              containerStyles="app__btn_blue_xs"
                              title="View Qualifications"
                              btnType="button"
                              handleClick={() => handleViewQualifications(item)}
                            />
                            <CustomButton
                              containerStyles="app__btn_blue_xs"
                              title="View Casted Points"
                              btnType="button"
                              handleClick={() =>
                                handleViewCommitteePoints(item)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Show Applicants Modal */}
      {selectedItem && showQualificationsModal && (
        <ApplicantDetails
          applicantData={selectedItem}
          hideModal={() => setShowQualificationsModal(false)}
        />
      )}
      {/* Show Casted Points Modal */}
      {showCommitteePointsModal && selectedItem && (
        <CommitteePointsModal
          applicantData={selectedItem}
          hideModal={() => setShowCommitteePointsModal(false)}
        />
      )}
    </>
  )
}

export default RankingApplicants
