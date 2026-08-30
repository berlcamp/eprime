import { ConfirmModal, CustomButton } from '@/components/index'
import ApplicantDetails from '@/components/Rsp/ApplicantDetails'
import CommitteePointsModal from '@/components/Rsp/CommitteePointsModal'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  ApplicantDocuments,
  ApplicantTypes,
  RankingCommitteeCriteriaTypes,
  RankingCommitteeTypes,
  RankingEvaluatorTypes,
  RankingTypes
} from '@/types'
import { CommitteeAccumulatedPoints } from '@/utils/data-helpers'
import { logError } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import {
  AcademicCapIcon,
  ChevronDownIcon,
  EnvelopeIcon
} from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState } from 'react'

import axios from 'axios'
import { ListIcon, TrashIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { MdChecklist } from 'react-icons/md'
import CastPoints from './CastPoints'
import ConfirmChangeStatusModal from './ConfirmChangeStatusModal'

// import { Resend } from 'resend'
// const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_KEY)

interface ModalProps {
  hideModal: () => void
  rankingId: string
  rankingDetails: RankingTypes
}

interface ListTypes {
  applicant: ApplicantTypes
  accumulated_points: Record<string, number> | null
  overall_score: string
  ranking: RankingTypes
}

const RankingApplicants = ({
  hideModal,
  rankingId,
  rankingDetails
}: ModalProps) => {
  const [showQualificationsModal, setShowQualificationsModal] = useState(false)
  const [showCastPointsModal, setShowCastPointsModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [showCommitteePointsModal, setShowCommitteePointsModal] =
    useState(false)
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [refetch, setRefetch] = useState(false)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)

  const [evaluators, setEvaluators] = useState<RankingEvaluatorTypes[] | []>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchMajor, setSearchMajor] = useState('')
  // use for Cast Points modal
  const [commiteeId, setCommitteeId] = useState('')
  const [criterias, setCriterias] = useState<
    RankingCommitteeCriteriaTypes[] | []
  >([])

  const [canCastPoints, setCanCastPoints] = useState(false)

  const [list, setList] = useState<ListTypes[] | []>([])
  const [majors, setMajors] = useState<string[] | []>([])
  const [originalList, setOriginalList] = useState<ListTypes[] | []>([])
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

  const handleChangeEvaluationStatus = async (reason: string) => {
    if (!selectedItem) return
    try {
      const { error } = await supabase
        .from('hrm_ranking_applicants')
        .update({
          evaluation_status: selectedStatus,
          reason_for_disqualification: reason,
          // Dates the HR screening stage of the turnaround report.
          evaluated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id)

      if (error) {
        void logError(
          'Update Ranking Evaluation Status',
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
      setToast('success', 'Successfully updated!')
      setShowChangeStatusModal(false)
      setRefetch(!refetch)
    } catch (e) {
      console.error(e)
    }
  }

  const triggerChangeEvaluationStatus = async (
    applicant: ApplicantTypes,
    status: string
  ) => {
    setSelectedItem(applicant)
    setSelectedStatus(status)
    setShowChangeStatusModal(true)
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
    const qualifications = rankingDetails.qualifications

    if (statuses.length === 0) {
      return 'No Qualifications'
    }

    // Filter required qualifications
    const requiredQualifications = qualifications.filter((q) => q.required)

    // Check if all required qualifications exist in statuses
    const allRequiredExist = requiredQualifications.every((q) =>
      statuses.some((s) => s.qualification_id === q.id)
    )

    if (!allRequiredExist) {
      return 'Not Qualified'
    }

    // Extract statuses for required qualifications only
    const requiredStatuses = statuses.filter((s) =>
      requiredQualifications.some((q) => q.id === s.qualification_id)
    )

    if (requiredStatuses.some((s) => s.status === 'Not Okay')) {
      return 'Not Qualified'
    }

    if (requiredStatuses.some((s) => s.status === 'For Evaluation')) {
      return 'For Evaluation'
    }

    if (requiredStatuses.every((s) => s.status === 'Okay')) {
      return 'Qualified'
    }

    return 'Not Known'
  }

  const handleSearchApplicant = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const searchTerm = e.target.value
    setSearchKeyword(searchTerm)

    if (searchTerm.trim().length < 3) {
      setList(originalList)
      return
    }

    // Search user
    const searchWords = e.target.value.split(' ')
    const results = list.filter((user) => {
      const fullName =
        `${user.applicant.firstname} ${user.applicant.middlename} ${user.applicant.lastname}`.toLowerCase()
      return searchWords.every((word) => fullName.includes(word.toLowerCase()))
    })

    setList(results)
  }
  const handleSearchMajor = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const searchTerm = e.target.value
    setSearchMajor(searchTerm)

    if (searchTerm.trim() !== '') {
      const filteredArr = originalList.filter(
        (item) => item.applicant.specific_major === searchTerm
      )
      setList(filteredArr)
    } else {
      setList(originalList)
    }
  }

  const handleSendEirEMail = async (applicant: ApplicantTypes) => {
    // Email the applicant on the server side
    axios
      .post('/api/ieremail', {
        email: applicant.email,
        applicant
      })
      .then(async function () {
        await supabase
          .from('hrm_ranking_applicants')
          .update({
            eir_email_sent: true
          })
          .eq('id', applicant.id)
        setToast('success', 'Email sent')
        setList((prevList) =>
          prevList.map((item) =>
            item.applicant.id === applicant.id
              ? {
                  ...item,
                  applicant: { ...item.applicant, eir_email_sent: true }
                }
              : item
          )
        )
      })
      .catch(function (error) {
        void logError(
          'EIR Email failed',
          'EIR Email',
          '',
          JSON.stringify(error)
        )
        console.error(error)
      })
  }

  useEffect(() => {
    const fetchApplicantsData = async () => {
      const { data } = await supabase
        .from('hrm_ranking_applicants')
        .select(
          '*,applicant_documents:hrm_ranking_applicant_documents(qualification_id,status),ranking:ranking_id(type,year,status,position:position_id(name),chairman_id,committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))',
          {
            count: 'exact'
          }
        )
        .eq('ranking_id', rankingId)
        .order('lastname', { ascending: true })

      if (data && data.length > 0) {
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
                  .toFixed(3)
              : ''
          })
        })

        // Sort structguredData by overall_score in descending order
        structguredData.sort((a, b) => {
          const scoreA = parseFloat(a.overall_score || '0')
          const scoreB = parseFloat(b.overall_score || '0')
          return scoreB - scoreA // Sort in descending order
        })

        // Extract unique majors using Array.from() to avoid spread operator issues
        const uniqueMajors = Array.from(
          new Set(structguredData.map((item) => item.applicant.specific_major))
        )

        setMajors(uniqueMajors)

        setList(structguredData)
        setOriginalList(structguredData)
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
        .eq('user_id', session?.user.id)
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

    const fetchEvaluators = async () => {
      const { data: evaluatorsData } = await supabase
        .from('hrm_ranking_evaluators')
        .select()
        .eq('ranking_id', rankingId)
      setEvaluators(evaluatorsData ?? [])
    }

    void fetchEvaluators()
    void fetchApplicantsData()
    void fetchCommitteeCriteriasData()
  }, [refetch])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Ranking Applicants</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              <div className="flex space-x-2">
                <input
                  placeholder="Search applicant"
                  type="text"
                  value={searchKeyword}
                  onChange={handleSearchApplicant}
                  className="app__input_standard"
                />
                <select
                  value={searchMajor}
                  onChange={handleSearchMajor}
                  className="app__input_standard"
                >
                  <option value="">Filter by Major</option>
                  {majors.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <table className="app__table mt-4 mb-60">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th"></th>
                    <th className="app__th">Applicant</th>
                    <th className="app__th">QS Status</th>
                    <th className="app__th">Applicant Status</th>
                    <th className="app__th">Accumulated Points</th>
                    <th className="app__th">Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length > 0 &&
                    list.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="w-6 pl-4 app__td">
                          <Menu as="div" className="app__menu_container">
                            <div>
                              <Menu.Button className="app__dropdown_btn">
                                <ChevronDownIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </Menu.Button>
                            </div>

                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="app__dropdown_items">
                                <div className="py-1">
                                  {item.ranking.chairman_id ===
                                    session?.user.id && (
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleRemoveApplicant(item.applicant)
                                        }
                                        className="app__dropdown_item"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                        <span>Remove this Applicant</span>
                                      </div>
                                    </Menu.Item>
                                  )}
                                  <Menu.Item>
                                    <div
                                      onClick={() =>
                                        handleViewQualifications(item.applicant)
                                      }
                                      className="app__dropdown_item"
                                    >
                                      <AcademicCapIcon className="w-4 h-4" />
                                      <span>
                                        View Qualifications / IER Data
                                      </span>
                                    </div>
                                  </Menu.Item>
                                  <Menu.Item>
                                    <div className="app__dropdown_item">
                                      <AcademicCapIcon className="w-4 h-4" />
                                      <Link
                                        href={`/rankingies/${item.applicant.id}`}
                                      >
                                        View IES Data
                                      </Link>
                                    </div>
                                  </Menu.Item>
                                  {evaluators.some(
                                    (evaluator) =>
                                      evaluator.user_id === session?.user.id
                                  ) && (
                                    <>
                                      {item.applicant.evaluation_status !==
                                        'Qualified' && (
                                        <Menu.Item>
                                          <div
                                            onClick={() =>
                                              triggerChangeEvaluationStatus(
                                                item.applicant,
                                                'Qualified'
                                              )
                                            }
                                            className="app__dropdown_item"
                                          >
                                            <UserIcon className="w-4 h-4" />
                                            <span>
                                              Change Applicant Status to
                                              "Qualified"
                                            </span>
                                          </div>
                                        </Menu.Item>
                                      )}
                                      {item.applicant.evaluation_status !==
                                        'Disqualified' && (
                                        <Menu.Item>
                                          <div
                                            onClick={() =>
                                              triggerChangeEvaluationStatus(
                                                item.applicant,
                                                'Disqualified'
                                              )
                                            }
                                            className="app__dropdown_item"
                                          >
                                            <UserIcon className="w-4 h-4" />
                                            <span>
                                              Change Applicant Status to
                                              "Disqualified"
                                            </span>
                                          </div>
                                        </Menu.Item>
                                      )}
                                      {item.applicant.evaluation_status !==
                                        'For Evaluation' && (
                                        <Menu.Item>
                                          <div
                                            onClick={() =>
                                              triggerChangeEvaluationStatus(
                                                item.applicant,
                                                'For Evaluation'
                                              )
                                            }
                                            className="app__dropdown_item"
                                          >
                                            <UserIcon className="w-4 h-4" />
                                            <span>
                                              Change Applicant Status to "For
                                              Evaluation"
                                            </span>
                                          </div>
                                        </Menu.Item>
                                      )}
                                    </>
                                  )}
                                  {item.applicant.evaluation_status ===
                                    'Qualified' && (
                                    <>
                                      <Menu.Item>
                                        <div
                                          onClick={() =>
                                            handleViewCommitteePoints(
                                              item.applicant
                                            )
                                          }
                                          className="app__dropdown_item"
                                        >
                                          <MdChecklist className="w-4 h-4" />
                                          <span>View Casted Points</span>
                                        </div>
                                      </Menu.Item>
                                      {canCastPoints &&
                                        item.ranking.status === 'Open' && (
                                          <Menu.Item>
                                            <div
                                              onClick={() =>
                                                handleCastPoints(item.applicant)
                                              }
                                              className="app__dropdown_item"
                                            >
                                              <ListIcon className="w-4 h-4" />
                                              <span>Cast Points</span>
                                            </div>
                                          </Menu.Item>
                                        )}
                                    </>
                                  )}
                                  {!item.applicant.eir_email_sent &&
                                    item.ranking.chairman_id ===
                                      session?.user.id && (
                                      <Menu.Item>
                                        <div
                                          onClick={() =>
                                            handleSendEirEMail(item.applicant)
                                          }
                                          className="app__dropdown_item"
                                        >
                                          <EnvelopeIcon className="w-4 h-4" />
                                          <span>Send IER to email</span>
                                        </div>
                                      </Menu.Item>
                                    )}
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                        <th className="app__th_firstcol space-y-2">
                          <div className="font-medium">
                            {index + 1}. {item.applicant.lastname},{' '}
                            {item.applicant.firstname}{' '}
                            {item.applicant.middlename}
                          </div>
                          <div className="font-light">
                            Application Code: {item.applicant.code}
                          </div>
                          <div className="font-light">
                            Major: {item.applicant.specific_major}
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

                          <div className="font-light">
                            IER Email:{' '}
                            <span className="font-bold">
                              {item.applicant.eir_email_sent
                                ? 'Sent'
                                : 'Not yet sent'}
                            </span>
                          </div>
                        </th>
                        <td className="app__td">
                          <div className="mt-1 whitespace-nowrap">
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
                              <span className="whitespace-nowrap text-green-500 bg-green-100 border border-green-500 py-px px-1">
                                Qualified
                              </span>
                            )}
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'Not Qualified' && (
                              <span className="whitespace-nowrap text-red-500 bg-red-100 border border-red-500 py-px px-1">
                                Not Qualified
                              </span>
                            )}
                            {qualificationStatus(
                              item.applicant.applicant_documents
                            ) === 'No Qualifications' && (
                              <span className="whitespace-nowrap text-red-500 bg-red-100 border border-red-500 py-px px-1">
                                No Qualifications
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="app__td">
                          <div className="mt-1 whitespace-nowrap">
                            {item.applicant.evaluation_status ===
                              'For Evaluation' && (
                              <span className=" whitespace-nowrap text-orange-500 bg-orange-100 border border-orange-500 py-px px-1">
                                For Evaluation
                              </span>
                            )}
                            {item.applicant.evaluation_status ===
                              'Qualified' && (
                              <span className="whitespace-nowrap text-green-500 bg-green-100 border border-green-500 py-px px-1">
                                Qualified
                              </span>
                            )}
                            {item.applicant.evaluation_status ===
                              'Disqualified' && (
                              <span className="whitespace-nowrap text-red-500 bg-red-100 border border-red-500 py-px px-1">
                                Disqualified
                              </span>
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
                                      {avgPoints.toFixed(3)}{' '}
                                    </span>
                                    {/* Display with 2 decimal places */}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="app__td">
                          {Number(item.overall_score).toFixed(3)}
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
      {/* Confirm Change Status Modal */}
      {showChangeStatusModal && (
        <ConfirmChangeStatusModal
          header="Confirm Change"
          btnText="Confirm"
          status={selectedStatus}
          message="Please confirm this action"
          onConfirm={handleChangeEvaluationStatus}
          onCancel={() => setShowChangeStatusModal(false)}
        />
      )}
    </>
  )
}

export default RankingApplicants
