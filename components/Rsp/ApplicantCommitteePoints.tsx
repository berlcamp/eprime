import { useSupabase } from '@/context/SupabaseProvider'
import { runListQuery, type QueryError } from '@/utils/query-result'
import { ApplicantTypes, RankingCommitteeTypes } from '@/types'
import { useEffect, useState } from 'react'
import TwoColTableLoading from '../Loading/TwoColTableLoading'

interface PropTypes {
  applicantData: ApplicantTypes
}

const ApplicantCommitteePoints = ({ applicantData }: PropTypes) => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<RankingCommitteeTypes[] | []>([])
  const [loadError, setLoadError] = useState<QueryError | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      const result = await runListQuery<RankingCommitteeTypes>(
        {
          transaction: 'Fetch applicant committee points',
          table: 'hrm_ranking_committees',
          payload: {
            rankingId: applicantData.ranking_id,
            applicantId: applicantData.id
          }
        },
        supabase
          .from('hrm_ranking_committees')
          .select(
            '*, hrm_user:user_id(id,firstname,lastname,avatar_url),committee_criterias:hrm_ranking_committee_criterias(*,criteria:criteria_id(*),criteria_points:hrm_ranking_applicant_points(*))'
          )
          .eq('ranking_id', applicantData.ranking_id)
          .eq(
            'committee_criterias.hrm_ranking_applicant_points.applicant_id',
            applicantData.id
          )
      )

      // Falling through read as "no committee has scored this applicant".
      if (!result.ok) {
        setLoadError(result.error)
        setLoading(false)
        return
      }

      setLoadError(null)

      // only pull committees that has criteria assigned
      setList(
        result.data.filter(
          (c: RankingCommitteeTypes) =>
            c.committee_criterias && c.committee_criterias.length > 0
        )
      )
      setLoading(false)
    }

    void fetchData()
  }, [applicantData])

  return (
    <div>
      {loadError && (
        <div className="mb-2 text-xs text-red-600">
          {loadError.message} No committee scores are shown for this applicant.
        </div>
      )}
      {loading && <TwoColTableLoading />}
      {!loading && list.length > 0 && (
        <table className="app__table">
          <thead className="app__thead">
            <tr>
              <th className="app__th">Committee Members Who can Cast Points</th>
              <th className="app__th">Criteria Points</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={i}>
                <td className="app__td">
                  <span className="font-bold">
                    {item.hrm_user?.lastname}, {item.hrm_user?.firstname}{' '}
                    {item.hrm_user?.middlename}{' '}
                  </span>
                  <span>({item.type})</span>
                </td>
                <td className="app__td">
                  {item.committee_criterias?.map((c, j) => (
                    <div key={j}>
                      <span>{c.criteria.name}: </span>

                      {c.criteria_points && c.criteria_points.length > 0 && (
                        <span className="font-bold">
                          {Number(c.criteria_points[0].points).toFixed(3)}
                        </span>
                      )}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ApplicantCommitteePoints
