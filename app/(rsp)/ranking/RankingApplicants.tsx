import { ConfirmModal, CustomButton } from '@/components'
import ApplicantDetails from '@/components/Rsp/ApplicantDetails'
import CommitteePointsModal from '@/components/Rsp/CommitteePointsModal'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  ApplicantDocuments,
  ApplicantTypes,
  RankingCommitteeCriteriaTypes,
  RankingCommitteeTypes,
  RankingTypes
} from '@/types'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import CastPoints from './CastPoints'

import { DisqualificationTemplate } from '@/components/Emails/DisqualificationTemplate'
import { Resend } from 'resend'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_KEY)

interface ModalProps {
  hideModal: () => void
  rankingId: string
}

interface ListTypes {
  applicant: ApplicantTypes
  accumulated_points: Record<string, number> | null
  overall_score: string
  ranking: RankingTypes
}

const RankingApplicants = ({ hideModal, rankingId }: ModalProps) => {
  const [showQualificationsModal, setShowQualificationsModal] = useState(false)
  const [showCastPointsModal, setShowCastPointsModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
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

  const [list, setList] = useState<ListTypes[] | []>([])
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const handleViewQualifications = (item: ApplicantTypes) => {
    setShowQualificationsModal(true)
    setSelectedItem(item)
  }
  const handleRemoveApplicant = (item: ApplicantTypes) => {
    setShowRemoveModal(true)
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

  const handleRemoveConfirmed = async () => {
    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .delete()
        .eq('id', selectedItem?.id)

      if (error) {
        void logError(
          'Delete Ranking Applicant',
          'hrm_ranking_applicants',
          '',
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // pop up the success message
      setToast('success', 'Successfully Deleted!')

      setShowRemoveModal(false)
      setRefetch(!refetch)
    } catch (e) {
      console.error(e)
    }
  }

  const qualificationStatus = (statuses: ApplicantDocuments[]) => {
    if (statuses.length === 0) {
      return 'No Qualifications'
    }
    if (statuses.some((item) => item.status === 'Not Okay')) {
      return 'Not Qualified'
    } else if (statuses.some((item) => item.status === 'For Evaluation')) {
      return 'For Evaluation'
    } else if (statuses.every((item) => item.status === 'Okay')) {
      return 'Qualified'
    }
    return 'Not Known'
  }

  const handleSendDisqualificationEMail = async (email: string) => {
    // Usage
    const header = (
      <p>
        Dear <strong>John Doe</strong>,
      </p>
    )
    const body = (
      <>
        <p>
          Congratulations! Your registration to the{' '}
          <strong>PRIME-HRM system of DepEd Bayugan</strong> has been
          successfully approved.
        </p>
        <p>
          Click this{' '}
          <a
            href="https://eprime.sortbrite.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            link
          </a>{' '}
          to login and access your account.
        </p>
      </>
    )

    try {
      const { error } = await resend.emails.send({
        from: 'DepEd Bayugan (No-reply) <noreply@sortbrite.com>',
        to: [email],
        subject: 'PRIME-HRM - Application Disqualification',
        react: DisqualificationTemplate({
          header,
          body
        }) as React.ReactElement
      })

      if (error) {
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const fetchApplicantsData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_applicants')
        .select(
          '*,applicant_documents:hrm_ranking_applicant_documents(status),ranking:ranking_id(status,chairman_id,committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
          {
            count: 'exact'
          }
        )
        .eq('ranking_id', rankingId)
        .order('lastname', { assending: true })

      if (data.length > 0) {
        const structguredData: ListTypes[] = []
        data.forEach((d: ApplicantTypes) => {
          const accumulatedPoints: Record<string, number> | null =
            CommitteeAccumulatedPoints(d.id, d.ranking.committees)

          structguredData.push({
            applicant: d,
            ranking: d.ranking,
            accumulated_points: accumulatedPoints,
            overall_score: accumulatedPoints
              ? Object.values(accumulatedPoints)
                  .reduce((sum: number, points) => sum + points, 0)
                  .toFixed(2)
              : ''
          })
        })

        // Sort structguredData by overall_score in descending order
        structguredData.sort((a, b) => {
          const scoreA = parseFloat(a.overall_score || '0')
          const scoreB = parseFloat(b.overall_score || '0')
          return scoreB - scoreA // Sort in descending order
        })

        setList(structguredData)
      }
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
                    <th className="app__th">Accumulated Points</th>
                    <th className="app__th">Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length > 0 &&
                    list.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <th className="app__th_firstcol">
                          <div className="font-medium">
                            {item.applicant.lastname},{' '}
                            {item.applicant.firstname}{' '}
                            {item.applicant.middlename}
                          </div>
                          <div className="font-light">
                            {item.applicant.email}
                          </div>
                          {item.applicant.current_employee === 'Yes' && (
                            <div className="font-bold">
                              (Current DepEd Employee)
                            </div>
                          )}
                          {item.applicant.previous_applicant === 'Yes' && (
                            <div className="font-bold">
                              (Previous Applicant)
                            </div>
                          )}
                          <div className="mt-1">
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'For Evaluation' && (
                              <span className="text-orange-500 bg-orange-100 border border-orange-500 py-px px-1">
                                For Evaluation
                              </span>
                            )}
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'Qualified' && (
                              <span className="text-green-500 bg-green-100 border border-green-500 py-px px-1">
                                Qualified
                              </span>
                            )}
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'Not Qualified' && (
                              <span className="text-red-500 bg-red-100 border border-red-500 py-px px-1">
                                Not Qualified
                              </span>
                            )}
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'No Qualifications' && (
                              <span className="text-red-500 bg-red-100 border border-red-500 py-px px-1">
                                No Qualifications
                              </span>
                            )}
                          </div>
                        </th>
                        <td className="app__td">
                          <div className="space-x-2">
                            {item.ranking.chairman_id === session.user.id && (
                              <CustomButton
                                containerStyles="app__btn_red_xs"
                                title="Remove this Applicant"
                                btnType="button"
                                handleClick={() =>
                                  handleRemoveApplicant(item.applicant)
                                }
                              />
                            )}
                            <CustomButton
                              containerStyles="app__btn_blue_xs"
                              title="View Qualifications"
                              btnType="button"
                              handleClick={() =>
                                handleViewQualifications(item.applicant)
                              }
                            />
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'Qualified' && (
                              <>
                                <CustomButton
                                  containerStyles="app__btn_blue_xs"
                                  title="View Casted Points"
                                  btnType="button"
                                  handleClick={() =>
                                    handleViewCommitteePoints(item.applicant)
                                  }
                                />
                                {canCastPoints &&
                                  item.ranking.status === 'Open' && (
                                    <CustomButton
                                      containerStyles="app__btn_blue_xs"
                                      title="Cast Points"
                                      btnType="button"
                                      handleClick={() =>
                                        handleCastPoints(item.applicant)
                                      }
                                    />
                                  )}
                              </>
                            )}
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'Not Qualified' && (
                              <CustomButton
                                containerStyles="app__btn_red_xs"
                                title="Send Disqualification Email"
                                btnType="button"
                                handleClick={() =>
                                  handleSendDisqualificationEMail(
                                    item.applicant.email
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="app__td">
                          {item.accumulated_points && (
                            <div>
                              {Object.entries(item.accumulated_points).map(
                                ([criteriaName, avgPoints]) => (
                                  <div key={criteriaName}>
                                    <span>{criteriaName}:</span>
                                    <span className="font-bold">
                                      {' '}
                                      {avgPoints.toFixed(2)}{' '}
                                    </span>
                                    {/* Display with 2 decimal places */}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="app__td">{item.overall_score}</td>
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
          refetch={() => setRefetch(!refetch)}
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
      {/* Delete Modal */}
      {showRemoveModal && (
        <ConfirmModal
          header="Confirm Remove"
          btnText="Confirm"
          message="This action cannot be undone. Are you sure you want to remove this applicant?"
          onConfirm={handleRemoveConfirmed}
          onCancel={() => setShowRemoveModal(false)}
        />
      )}
    </>
  )
}

export default RankingApplicants
