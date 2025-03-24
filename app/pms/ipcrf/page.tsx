import { createServerClient } from '@/utils/supabase-server'
import 'server-only'
import Main from './Main'

// do not cache this page
export const revalidate = 0

export default async function page() {
  const supabase = createServerClient()

  // Fetch IPCRF Templates
  const { data: ipcrfTemplatesData } = await supabase
    .from('ipcrf_templates')
    .select('*', { count: 'exact' })
    .eq('is_published', 'true')
    .order('id', { ascending: false })

  // Fetch Core Behavioral Competencies, Include ones from archives
  // const { data: competenciesData } = await supabase
  //   .from('competencies')
  //   .select('*,competency_items(id,title)', { count: 'exact' })
  //   .eq('type', 'Core Behavioural')
  //   .order('title', { ascending: true })

  // Fetch Core Behavioral Competencies, Include ones from archives
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
    .order('title', { ascending: true })

  return (
    <>
      <Main
        ipcrfTemplates={ipcrfTemplatesData ?? []}
        // competencies={competenciesData ?? []}
        objectivesData={objectivesData ?? []}
      />
    </>
  )
}
