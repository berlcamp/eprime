import { CustomButton } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  ApplicantTypes,
  RankingCommitteeCriteriaTypes,
  RankingCommitteeTypes
} from '@/types'
import { useEffect, useState } from 'react'
import ApplicantQualifications from './ApplicantQualifications'
import CastPoints from './CastPoints'

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

const RankingApplicants = ({ hideModal, rankingId }: ModalProps) => {
  const [showQualificationsModal, setShowQualificationsModal] = useState(false)
  const [showCastPointsModal, setShowCastPointsModal] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [refetch, setRefetch] = useState(false)

  // use for Cast Points modal
  const [commiteeId, setCommitteeId] = useState('')
  const [criterias, setCriterias] = useState<
    RankingCommitteeCriteriaTypes[] | []
  >([])

  const [canCastPoints, setCanCastPoints] = useState(false)

  const [list, setList] = useState<ApplicantTypes[] | []>([])
  const { supabase, session } = useSupabase()

  const handleViewQualifications = (id: string) => {
    setShowQualificationsModal(true)
    setSelectedId(id)
  }
  const handleCastPoints = (id: string) => {
    setShowCastPointsModal(true)
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
                            <span className="font-light">({item.email})</span>
                          </div>
                        </th>
                        <td className="app__td">
                          <div className="space-x-2">
                            <CustomButton
                              containerStyles="app__btn_blue_xs"
                              title="View Qualifications"
                              btnType="button"
                              handleClick={() =>
                                handleViewQualifications(item.id)
                              }
                            />
                            {canCastPoints && (
                              <CustomButton
                                containerStyles="app__btn_blue_xs"
                                title="Cast Points"
                                btnType="button"
                                handleClick={() => handleCastPoints(item.id)}
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
      {showQualificationsModal && (
        <ApplicantQualifications
          applicantId={selectedId}
          hideModal={() => setShowQualificationsModal(false)}
        />
      )}
      {/* Show Cast Points Modal */}
      {showCastPointsModal && (
        <CastPoints
          committeeId={commiteeId}
          criterias={criterias}
          refetch={() => setRefetch(!refetch)}
          applicantId={selectedId}
          hideModal={() => setShowCastPointsModal(false)}
        />
      )}
    </>
  )
}

export default RankingApplicants
