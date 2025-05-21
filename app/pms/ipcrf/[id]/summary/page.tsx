'use client'

import { Sidebar, Title, TopBar } from '@/components/index'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  IpcrfCompetencyRating,
  IpcrfObjectiveRating,
  IpcrfTemplatesCompetencyTypes,
  IpcrfTemplatesObjectives,
  IpcrfTypes
} from '@/types/pmsTypes'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function IPCRFSummaryPage() {
  const { supabase } = useSupabase()
  const { id } = useParams()
  const ipcrfId = Number(id)

  const searchParams = useSearchParams()
  const period = searchParams.get('period') ?? '1st' // default to '1st'

  const [objectives, setObjectives] = useState<IpcrfTemplatesObjectives[]>([])
  const [objectiveRatings, setObjectiveRatings] = useState<
    IpcrfObjectiveRating[]
  >([])
  const [competencies, setCompetencies] = useState<
    IpcrfTemplatesCompetencyTypes[]
  >([])
  const [competencyRatings, setCompetencyRatings] = useState<
    IpcrfCompetencyRating[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: ipcrfData } = await supabase
        .from('pms_ipcrf')
        .select()
        .eq('id', ipcrfId)
        .single()
      const ipcrf: IpcrfTypes = ipcrfData

      const [
        { data: objectivesRaw },
        { data: ratingsRaw },
        { data: competenciesRaw },
        { data: compRatingsRaw }
      ] = await Promise.all([
        supabase
          .from('pms_ipcrf_template_objectives')
          .select('*,objective:objective_id(title)')
          .eq('ipcrf_template_id', ipcrf.ipcrf_template_id),
        supabase
          .from('pms_ipcrf_objective_ratings')
          .select('*')
          .eq('ipcrf_id', ipcrfId)
          .eq('rater_type', 'self')
          .eq('period', period),
        supabase
          .from('pms_ipcrf_template_competencies')
          .select(
            `
            *,
            competency:competency_id (
              id,
              title,
              compentency_items:pms_competency_items ( id, title )
            )
          `
          )
          .eq('ipcrf_template_id', ipcrf.ipcrf_template_id),
        supabase
          .from('pms_ipcrf_competency_ratings')
          .select()
          .eq('ipcrf_id', ipcrfId)
          .eq('rater_type', 'self')
          .eq('period', period)
      ])

      setObjectives(objectivesRaw || [])
      setObjectiveRatings(ratingsRaw || [])
      setCompetencies(competenciesRaw || [])
      setCompetencyRatings(compRatingsRaw || [])
    }

    void fetchData()
  }, [ipcrfId])

  function calculateObjectiveScore(
    rating: IpcrfObjectiveRating,
    objective: IpcrfTemplatesObjectives
  ) {
    const values = []
    if (rating.quality !== null && rating.quality !== undefined)
      values.push(rating.quality)
    if (rating.efficiency !== null && rating.efficiency !== undefined)
      values.push(rating.efficiency)
    if (rating.timeliness !== null && rating.timeliness !== undefined)
      values.push(rating.timeliness)

    if (values.length === 0) return ''

    const average = values.reduce((sum, v) => sum + v, 0) / values.length
    return ((average * objective.weight) / 100).toFixed(2)
  }

  function countCompetencyItems(comp: IpcrfTemplatesCompetencyTypes) {
    const checkedItems =
      comp.competency?.compentency_items?.filter((item) =>
        competencyRatings.some((r) => r.competency_item_id === item.id)
      ) || []
    return {
      count: checkedItems.length,
      items: checkedItems.map((i) => i.title)
    }
  }

  const exportToPDF = () => {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF()
    doc.text('IPCRF Summary Report', 14, 10)

    autoTable(doc, {
      head: [['Objective', 'Quality', 'Efficiency', 'Timeliness', 'Score']],
      body: objectives.map((obj) => {
        const rating = objectiveRatings.find(
          (r) => r.template_objective_id === obj.id
        )
        return [
          obj.objective?.title,
          rating?.quality ?? '',
          rating?.efficiency ?? '',
          rating?.timeliness ?? '',
          rating ? calculateObjectiveScore(rating, obj) : ''
        ]
      })
    })

    autoTable(doc, {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Competency', 'Score', 'Checked Items']],
      body: competencies.map((comp) => {
        const { count, items } = countCompetencyItems(comp)
        return [comp.competency?.title, count.toString(), items.join(', ')]
      })
    })

    doc.save('ipcrf_summary.pdf')
  }

  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Summary')

    ws.addRow(['Objective', 'Quality', 'Efficiency', 'Timeliness', 'Score'])
    objectives.forEach((obj) => {
      const rating = objectiveRatings.find(
        (r) => r.template_objective_id === obj.id
      )
      ws.addRow([
        obj.objective?.title,
        rating?.quality ?? '',
        rating?.efficiency ?? '',
        rating?.timeliness ?? '',
        rating ? calculateObjectiveScore(rating, obj) : ''
      ])
    })

    ws.addRow([])
    ws.addRow(['Competency', 'Score', 'Checked Items'])
    competencies.forEach((comp) => {
      const { count, items } = countCompetencyItems(comp)
      ws.addRow([comp.competency?.title, count, items.join(', ')])
    })

    const buffer = await wb.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), 'ipcrf_summary.xlsx')
  }

  return (
    <>
      <Sidebar>
        <PmsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Ratings Summary" />
          </div>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Objectives</h2>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th">Objective</th>
                  <th className="app__th">Quality</th>
                  <th className="app__th">Efficiency</th>
                  <th className="app__th">Timeliness</th>
                  <th className="app__th">Score</th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((obj) => {
                  const rating = objectiveRatings.find(
                    (r) => r.template_objective_id === obj.id
                  )
                  return (
                    <tr key={obj.id} className="app__tr">
                      <td className="app__td">{obj.objective?.title}</td>
                      <td className="app__td">{rating?.quality ?? ''}</td>
                      <td className="app__td">{rating?.efficiency ?? ''}</td>
                      <td className="app__td">{rating?.timeliness ?? ''}</td>
                      <td className="app__td">
                        {rating ? calculateObjectiveScore(rating, obj) : ''}
                      </td>
                    </tr>
                  )
                })}
                {/* Final Score Row */}
                <tr className="app__tr">
                  <td className="app__td text-right" colSpan={4}>
                    Final Score
                  </td>
                  <td className="app__td font-bold">
                    {
                      // Compute total weighted score and format to 2 decimal places
                      objectives
                        .reduce((total, obj) => {
                          const rating = objectiveRatings.find(
                            (r) => r.template_objective_id === obj.id
                          )
                          const score = rating
                            ? calculateObjectiveScore(rating, obj)
                            : 0
                          return total + (Number(score) || 0)
                        }, 0)
                        .toFixed(2)
                    }
                  </td>
                </tr>
              </tbody>
            </table>

            <h2 className="text-lg font-semibold mb-2">Competencies</h2>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th">Competency</th>
                  <th className="app__th">Score</th>
                  <th className="app__th">Checked Items</th>
                </tr>
              </thead>
              <tbody>
                {competencies.map((comp) => {
                  const { count, items } = countCompetencyItems(comp)
                  return (
                    <tr key={comp.id} className="app__tr">
                      <td className="app__td">{comp.competency?.title}</td>
                      <td className="app__td">{count}</td>
                      <td className="app__td">
                        <div className="flex flex-col">
                          {items.map((item, index) => (
                            <div key={index}>{item}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex gap-2 mt-4">
              <Button onClick={exportToPDF}>Export to PDF</Button>
              <Button onClick={exportToExcel}>Export to Excel</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
