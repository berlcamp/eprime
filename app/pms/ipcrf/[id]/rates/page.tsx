import RatingForm from '@/components/ipcrf/RatingForm'
import {
  IpcrfTemplatesCompetencyTypes,
  IpcrfTemplatesObjectives,
  IpcrfTypes
} from '@/types/pmsTypes'
import { createServerClient } from '@/utils/supabase-server'

export default async function IPCRFRatingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerClient()
  const { id } = await params
  const ipcrfId = Number(id)

  // Fetch IPCRF
  const { data: ipcrf } = await supabase
    .from('pms_ipcrf')
    .select('*, template:ipcrf_template_id(*)')
    .eq('id', ipcrfId)
    .single()

  const ipcrfData: IpcrfTypes = ipcrf

  if (!ipcrfData) return <div className="p-6">IPCRF not found.</div>

  // Fetch Template Objectives
  const { data: objectives } = await supabase
    .from('pms_ipcrf_template_objectives')
    .select('*,objective:objective_id(*)')
    .eq('ipcrf_template_id', ipcrf.ipcrf_template_id)

  // Fetch Template Competencies + Items
  const { data: competencies } = await supabase
    .from('pms_ipcrf_template_competencies')
    .select(
      '*, competency:competency_id(*, compentency_items:pms_competency_items(*))'
    ) // Nested fetch
    .eq('ipcrf_template_id', ipcrf.ipcrf_template_id)

  // Fetch existing objective ratings
  const { data: existingObjectiveRatings } = await supabase
    .from('pms_ipcrf_objective_ratings')
    .select('template_objective_id, quality, efficiency, timeliness')
    .eq('ipcrf_id', ipcrf.id)
    .eq('rater_type', 'self')
    .eq('period', '1st')

  // Fetch existing competency ratings
  const { data: existingCompetencyRatings } = await supabase
    .from('pms_ipcrf_competency_ratings')
    .select(
      `
        competency_item_id,
        competency_item:competency_item_id (
          competency_id
        )
      `
    )
    .eq('ipcrf_id', ipcrf.id)
    .eq('rater_type', 'self')
    .eq('period', '1st')

  // Prepare objective ratings map: { [template_objective_id]: { quality, efficiency, timeliness } }
  const objectiveRatingsMap = (existingObjectiveRatings ?? []).reduce<
    Record<
      number,
      { quality?: number; efficiency?: number; timeliness?: number }
    >
  >((acc, row) => {
    acc[row.template_objective_id] = {
      quality: row.quality,
      efficiency: row.efficiency,
      timeliness: row.timeliness
    }
    return acc
  }, {})

  // Prepare competency ratings map: { [competency_id]: [competency_item_ids] }
  const competencyRatingsMap = (existingCompetencyRatings ?? []).reduce<
    Record<number, number[]>
  >((acc, row) => {
    const competencyId = (
      row.competency_item as unknown as { competency_id: number }
    )?.competency_id
    if (!competencyId) return acc
    if (!acc[competencyId]) acc[competencyId] = []
    acc[competencyId].push(row.competency_item_id)
    return acc
  }, {})

  const handleSubmit = async ({
    objectiveRatings,
    competencyRatings
  }: {
    objectiveRatings: Record<
      number,
      {
        quality?: number
        efficiency?: number
        timeliness?: number
      }
    >
    competencyRatings: Record<number, number[]> // competency_id => item_ids[]
  }) => {
    'use server'

    const supabase = await createServerClient()
    const ipcrf_id = ipcrfData.id
    const rater_type = 'self'
    const period = ipcrfData.template?.status ?? ''

    // Insert or update Objective Ratings
    const objectiveInserts = Object.entries(objectiveRatings).map(
      ([objectiveId, rating]) => ({
        ipcrf_id,
        template_objective_id: Number(objectiveId),
        rater_type,
        period,
        quality: rating.quality ?? null,
        efficiency: rating.efficiency ?? null,
        timeliness: rating.timeliness ?? null
      })
    )

    // Delete existing ratings and upsert new ones
    if (objectiveInserts.length) {
      await supabase
        .from('pms_ipcrf_objective_ratings')
        .delete()
        .eq('ipcrf_id', ipcrf_id)
        .eq('rater_type', rater_type)
        .eq('period', period)
      await supabase
        .from('pms_ipcrf_objective_ratings')
        .upsert(objectiveInserts, {
          onConflict: 'ipcrf_id,template_objective_id,rater_type,period'
        })
    }

    // Insert or update Competency Ratings
    const competencyInserts = Object.entries(competencyRatings).flatMap(
      ([_, itemIds]) =>
        itemIds.map((itemId) => ({
          ipcrf_id,
          competency_item_id: itemId,
          rater_type,
          period
        }))
    )

    // Delete existing ratings and upsert new ones
    if (competencyInserts.length) {
      await supabase
        .from('pms_ipcrf_competency_ratings')
        .delete()
        .eq('ipcrf_id', ipcrf_id)
        .eq('rater_type', rater_type)
        .eq('period', period)
      await supabase
        .from('pms_ipcrf_competency_ratings')
        .upsert(competencyInserts, {
          onConflict: 'ipcrf_id,competency_item_id,rater_type,period'
        })
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">
        {ipcrfData.template.type} Ratings
      </h1>
      <div>Description: {ipcrfData.description}</div>
      <div className="mb-6">Rating Period: {ipcrfData.template?.status}</div>
      {ipcrfData.template?.status !== 'Disabled' && (
        <RatingForm
          ipcrf={ipcrfData}
          objectives={objectives as IpcrfTemplatesObjectives[]}
          competencies={competencies as IpcrfTemplatesCompetencyTypes[]}
          onSubmit={handleSubmit}
          initialObjectiveRatings={objectiveRatingsMap}
          initialCompetencyRatings={competencyRatingsMap}
        />
      )}
    </div>
  )
}
