import { CustomButton } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes } from '@/types'
import { useEffect, useState } from 'react'
import ApplicantQualifications from './ApplicantQualifications'

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

const RankingApplicants = ({ hideModal, rankingId }: ModalProps) => {
  const [showQualificationsModal, setShowQualificationsModal] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  const [list, setList] = useState<ApplicantTypes[] | []>([])
  const { supabase } = useSupabase()

  const handleViewQualifications = (id: string) => {
    setShowQualificationsModal(true)
    setSelectedId(id)
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
              <h5 className="app__modal_header_text">Ranking Details</h5>
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
                            <span className="font-light">({item.email})</span>
                          </div>
                        </th>
                        <td className="app__td">
                          <CustomButton
                            containerStyles="app__btn_blue_xs"
                            title="View Qualifications"
                            btnType="button"
                            handleClick={() =>
                              handleViewQualifications(item.id)
                            }
                          />
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
      {showQualificationsModal && (
        <ApplicantQualifications
          applicantId={selectedId}
          hideModal={() => setShowQualificationsModal(false)}
        />
      )}
    </>
  )
}

export default RankingApplicants
