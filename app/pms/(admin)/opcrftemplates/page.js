import 'server-only'
import React from 'react'
import { createServerClient } from '@/utils/supabase-server'
import Main from './Main'

export const metadata = { title: 'OPCRF Templates' }

// do not cache this page
export const revalidate = 0

export default async function page () {
  const supabase = createServerClient()

  // Fetch OPCRF Templates
  const { count: countOpcrfTemplates, data: opcrfTemplatesData } = await supabase
    .from('opcrf_templates')
    .select()
    .limit(10)
    .order('id', { ascending: false })

  // Fetch KRAs
  const { data: krasData } = await supabase
    .from('kra')
    .select()
    .neq('is_archive', 'true')
    .order('title', { ascending: true })

  // Fetch Objectives
  const { data: objectivesData } = await supabase
    .from('kra_objectives')
    .select(`*,
              kra (
                id,title
              )
            `, { count: 'exact' })
    .neq('is_archive', 'true')
    .order('title', { ascending: true })

  // Fetch Core Behavioral Competencies
  const { data: competenciesData } = await supabase
    .from('competencies')
    .select()
    .eq('type', 'Core Behavioural')
    .neq('is_archive', 'true')
    .order('title', { ascending: true })

  // Fetch Positions
  const { data: positionsData } = await supabase
    .from('positions')
    .select()
    .order('name', { ascending: true })

  return (
    <>
      <Main
        preFetchedData={opcrfTemplatesData}
        objectives={objectivesData}
        kras={krasData}
        competencies={competenciesData}
        positions={positionsData}
        count={countOpcrfTemplates}/>
    </>
  )
}
