import { createServerClient } from '@/utils/supabase-server'
import 'server-only'
import Main from './Main'

// do not cache this page
export const revalidate = 0

export default async function Page() {
  const supabase = createServerClient()

  // Fetch KRAs
  const { data: krasData } = await supabase
    .from('kra')
    .select()
    .neq('is_archive', 'true')
    .order('title', { ascending: true })

  // Fetch Objectives
  const { data: objectivesData } = await supabase
    .from('kra_objectives')
    .select(
      `*,
              kra (
                id,title
              )
            `,
      { count: 'exact' }
    )
    .neq('is_archive', 'true')
    .order('title', { ascending: true })

  // Fetch Core Behavioral Competencies
  const { data: competenciesData } = await supabase
    .from('competencies')
    .select('*,competency_items(id,title)', { count: 'exact' })
    // .neq('is_archive', 'true')
    .order('title', { ascending: true })

  // Fetch Positions
  const { data: positionsData } = await supabase
    .from('hrm_positions')
    .select()
    .order('name', { ascending: true })

  return (
    <>
      <Main
        objectives={objectivesData ?? []}
        kras={krasData ?? []}
        competencies={competenciesData ?? []}
        positions={positionsData ?? []}
      />
    </>
  )
}
