import { RankingCommitteeTypes } from '@/types'

export function CommitteeAccumulatedPoints(
  applicantId: string,
  committees: RankingCommitteeTypes[]
) {
  if (committees.length > 0) {
    // Object to store the total points and number of members for each criterion
    const pointsAccumulator: Record<
      string,
      { totalPoints: number; memberCount: number }
    > = {}

    committees.forEach((committee: RankingCommitteeTypes) => {
      committee.committee_criterias?.forEach((criteria) => {
        const criteriaName = criteria.criteria.name

        let totalPointsForThisCriteria = 0
        let memberCount = 0
        criteria.criteria_points.forEach((point) => {
          if (point.applicant_id.toString() === applicantId.toString()) {
            totalPointsForThisCriteria += Number(point.points)
            memberCount++
          }
        })

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

    return averagePointsData
  } else {
    return null
  }
}
