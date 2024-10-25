import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantTypes, RankingCommitteeTypes } from '@/types'
import { useEffect, useState } from 'react'
import TwoColTableLoading from '../Loading/TwoColTableLoading'

interface PropTypes {
  applicantData: ApplicantTypes
}

const ApplicantAccumulatedPoints = ({ applicantData }: PropTypes) => {
  const [loading, setLoading] = useState(false)
  const [averagePoints, setAveragePoints] = useState<Record<string, number>>({})
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('hrm_ranking_committees')
          .select(
            `*, hrm_user:user_id(id, firstname, lastname, avatar_url),
            committee_criterias:hrm_ranking_committee_criterias(
              *, 
              criteria:criteria_id(*), 
              criteria_points:hrm_ranking_applicant_points(*)
            )`
          )
          .eq('ranking_id', applicantData.ranking_id)
          .eq(
            'committee_criterias.hrm_ranking_applicant_points.applicant_id',
            applicantData.id
          )

        if (error) {
          console.error('Error fetching data:', error)
          return
        }

        if (data) {
          // Object to store the total points and number of members for each criterion
          const pointsAccumulator: Record<
            string,
            { totalPoints: number; memberCount: number }
          > = {}

          data.forEach((committee: RankingCommitteeTypes) => {
            committee.committee_criterias?.forEach((criteria) => {
              const criteriaName = criteria.criteria.name
              const totalPointsForThisCriteria =
                criteria.criteria_points.reduce((sum: number, point) => {
                  return sum + Number(point.points)
                }, 0)

              const memberCount = criteria.criteria_points.length

              // Accumulate points and track how many members cast points for each criterion
              if (!pointsAccumulator[criteriaName]) {
                pointsAccumulator[criteriaName] = {
                  totalPoints: totalPointsForThisCriteria,
                  memberCount
                }
              } else {
                pointsAccumulator[criteriaName].totalPoints +=
                  totalPointsForThisCriteria
                pointsAccumulator[criteriaName].memberCount += memberCount
              }
            })
          })

          // Calculate the average points for each criterion
          const averagePointsData: Record<string, number> = {}
          Object.entries(pointsAccumulator).forEach(
            ([criteriaName, { totalPoints, memberCount }]) => {
              // Prevent NaN by ensuring memberCount > 0
              averagePointsData[criteriaName] =
                memberCount > 0 ? totalPoints / memberCount : 0
            }
          )

          setAveragePoints(averagePointsData)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [applicantData])

  return (
    <div>
      {loading ? (
        <TwoColTableLoading />
      ) : (
        <div>
          {Object.entries(averagePoints).map(([criteriaName, avgPoints]) => (
            <div key={criteriaName}>
              <span>{criteriaName}:</span>
              <span className="font-bold"> {avgPoints.toFixed(2)} </span>
              {/* Display with 2 decimal places */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ApplicantAccumulatedPoints
