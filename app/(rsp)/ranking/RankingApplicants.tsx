import { CustomButton } from '@/components'
import ApplicantDetails from '@/components/Rsp/ApplicantDetails'
import CommitteePointsModal from '@/components/Rsp/CommitteePointsModal'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  ApplicantTypes,
  RankingCommitteeCriteriaTypes,
  RankingCommitteeTypes
} from '@/types'
import { useEffect, useState } from 'react'
import CastPoints from './CastPoints'

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

const RankingApplicants = ({ hideModal, rankingId }: ModalProps) => {
  const [showQualificationsModal, setShowQualificationsModal] = useState(false)
  const [showCastPointsModal, setShowCastPointsModal] = useState(false)
  const [showCommitteePointsModal, setShowCommitteePointsModal] =
    useState(false)
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null)
  const [refetch, setRefetch] = useState(false)

  // use for Cast Points modal
  const [commiteeId, setCommitteeId] = useState('')
  const [criterias, setCriterias] = useState<
    RankingCommitteeCriteriaTypes[] | []
  >([])

  const [canCastPoints, setCanCastPoints] = useState(false)

  const [list, setList] = useState<ApplicantTypes[] | []>([])
  const { supabase, session } = useSupabase()

  const handleViewQualifications = (item: ApplicantTypes) => {
    setShowQualificationsModal(true)
    setSelectedItem(item)
  }
  const handleCastPoints = (item: ApplicantTypes) => {
    setShowCastPointsModal(true)
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
        .select('*, ranking:ranking_id(status)')
        .eq('ranking_id', rankingId)
        .order('lastname', { assending: true })
      setList(data)
    }

    // find if logged in user belongs to any criteria
    const fetchCommitteeCriteriasData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_committees')
        .select(
          '*,committee_criterias:hrm_ranking_committee_criterias(*,criteria:criteria_id(*),criteria_points:hrm_ranking_applicant_points(*))'
        )
        .eq('ranking_id', rankingId)
        .eq('user_id', session.user.id)
        .maybeSingle()

      const committeeData: RankingCommitteeTypes = data

      if (
        committeeData?.committee_criterias &&
        committeeData?.committee_criterias.length > 0
      ) {
        setCommitteeId(committeeData.id)
        setCriterias(committeeData.committee_criterias)
        setCanCastPoints(true)
      }
    }

    void fetchApplicantsData()
    void fetchCommitteeCriteriasData()
  }, [refetch])

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
                            {canCastPoints &&
                              item.ranking.status === 'Open' && (
                                <CustomButton
                                  containerStyles="app__btn_blue_xs"
                                  title="Cast Points"
                                  btnType="button"
                                  handleClick={() => handleCastPoints(item)}
                                />
                              )}
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
      {/* Show Cast Points Modal */}
      {showCastPointsModal && selectedItem && (
        <CastPoints
          committeeId={commiteeId}
          criterias={criterias}
          refetch={() => setRefetch(!refetch)}
          applicantData={selectedItem}
          hideModal={() => setShowCastPointsModal(false)}
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
