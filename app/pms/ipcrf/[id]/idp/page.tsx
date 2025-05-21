'use client'
import { Sidebar, Title, TopBar } from '@/components/index'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList as updateList2 } from '@/GlobalRedux/Features/list2Slice'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { IpcrfCompetencyRating, IpcrfObjectiveRating } from '@/types/pmsTypes'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { List } from './List'
import { ListComp } from './ListComp'

type entriesType = {
  competencyId: any
  items: any
  score: any
}

export default function IDPPage({ params }: { params: { id: string } }) {
  const { supabase } = useSupabase()
  const ipcrfId = Number(params.id)

  // Redux staff
  const dispatch = useDispatch()

  const [topStrengthsObj, setTopStrengthsObj] = useState<
    IpcrfObjectiveRating[]
  >([])
  const [topWeaknessesObj, setTopWeaknessesObj] = useState<
    IpcrfObjectiveRating[]
  >([])
  const [topStrengthsComp, setTopStrengthsComp] = useState<entriesType[]>([])
  const [topWeaknessesComp, setTopWeaknessesComp] = useState<entriesType[]>([])

  const [objRatings, setObjRatings] = useState<IpcrfObjectiveRating[]>([])
  const [compRatings, setCompRatings] = useState<IpcrfCompetencyRating[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: objectiveRatings } = await supabase
        .from('pms_ipcrf_objective_ratings')
        .select(
          '*, template:template_objective_id(id,objective_id, objective:objective_id(id, title), weight)'
        )
        .eq('ipcrf_id', ipcrfId)
        .eq('rater_type', 'self')

      setObjRatings(objectiveRatings ?? [])

      const ratings = (objectiveRatings ?? []) as IpcrfObjectiveRating[]

      const scored = ratings
        .filter((r) => r.quality ?? r.efficiency ?? r.timeliness)
        .map((r) => {
          const values = [r.quality, r.efficiency, r.timeliness].filter(
            (v): v is number => v !== null && v !== undefined
          )

          const avg =
            values.reduce((sum, v) => sum + v, 0) / (values.length || 1)

          return {
            ...r,
            score: Number((avg * (r.template.weight || 1)).toFixed(2))
          }
        })

      const sorted = [...scored].sort((a, b) => b.score - a.score)
      setTopStrengthsObj(sorted.slice(0, 3))
      setTopWeaknessesObj(sorted.slice(-3).reverse())

      const { data: competencyRatingsData } = await supabase
        .from('pms_ipcrf_competency_ratings')
        .select(
          '*, competency_item:competency_item_id(id, title, competency_id, competency:competency_id(title)), competency:competency_item_id(competency_id,title)'
        )
        .eq('ipcrf_id', ipcrfId)
        .eq('rater_type', 'self')

      setCompRatings(competencyRatingsData ?? [])

      const competencyRatings: IpcrfCompetencyRating[] | null =
        competencyRatingsData
      const grouped = new Map()

      for (const r of competencyRatings ?? []) {
        const compId = r.competency_item.competency_id
        const title = r.competency_item.title

        if (!grouped.has(compId)) grouped.set(compId, [])
        grouped.get(compId).push(title)
      }

      const entries = Array.from(grouped.entries()).map(
        ([competencyId, items]) => ({
          competencyId,
          items,
          score: items.length
        })
      )

      const sortedComp = [...entries].sort((a, b) => b.score - a.score)
      setTopStrengthsComp(sortedComp.slice(0, 3))
      setTopWeaknessesComp(sortedComp.slice(-3).reverse())

      // Fetch User IDP
      const { data: funcData } = await supabase
        .from('pms_idp')
        .select('*, objective:objective_id(title)')
        .eq('comp_type', 'objective')
        .eq('ipcrf_id', ipcrfId)

      const { data: compData } = await supabase
        .from('pms_idp')
        .select(
          '*, competency_item:competency_item_id(title,competency:competency_id(title))'
        )
        .eq('comp_type', 'competency')
        .eq('ipcrf_id', ipcrfId)

      // Update the list in Redux store
      if (funcData) {
        dispatch(updateList(funcData))
      }
      if (compData) {
        dispatch(updateList2(compData))
      }
    }
    void fetchData()
  }, [])

  return (
    <>
      <Sidebar>
        <PmsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div className="app__title">
          <Title title="Individual Development Plan" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-4 border bg-gray-100 rounded-xl">
              <h2 className="font-bold mb-2">Objectives Ratings</h2>
              <div>
                <h3 className="font-semibold">Top 3 Strengths</h3>
                <ul className="list-disc list-inside">
                  {topStrengthsObj.map((r) => (
                    <li key={r.id}>{r.template?.objective?.title}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Top 3 Weaknesses</h3>
                <ul className="list-disc list-inside">
                  {topWeaknessesObj.map((r) => (
                    <li key={r.id}>{r.template?.objective?.title}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border bg-gray-100 rounded-xl">
              <h2 className="font-bold mb-2">Competency Ratings</h2>
              <div>
                <h3 className="font-semibold">Top 3 Strengths</h3>
                <ul className="list-disc list-inside">
                  {topStrengthsComp.map((r, i) => (
                    <li key={i}>{r.items.join(', ')}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Top 3 Weaknesses</h3>
                <ul className="list-disc list-inside">
                  {topWeaknessesComp.map((r, i) => (
                    <li key={i}>{r.items.join(', ')}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <List ipcrfId={ipcrfId} objRatings={objRatings} />
            <ListComp ipcrfId={ipcrfId} compRatings={compRatings} />
          </div>
        </div>
      </div>
    </>
  )
}
