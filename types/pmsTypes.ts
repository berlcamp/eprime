import { Employee, PositionTypes } from '.'

export interface KraTypes {
  id: number
  title: string
}
export interface CompetencyTypes {
  id: number
  title: string
  type: string
  compentency_items: CompetencyItemTypes[]
}
export interface CompetencyItemTypes {
  id: number
  competency_id: number
  title: string
}
export interface KraObjectiveTypes {
  id: number
  title: string
  kra_id: number
  is_archive: string
  kra: KraTypes
}
export interface IpcrfTemplatesTypes {
  id: number
  description: string
  type: string
  status: string
  positions: IpcrfTemplatesPositionsTypes[]
  objectives: IpcrfTemplatesObjectives[]
}
export interface IpcrfTemplatesPositionsTypes {
  ipcrf_template_id: number
  position_id: number
  position: PositionTypes
}
export interface IpcrfTemplatesCompetencyTypes {
  id: number
  ipcrf_template_id: number
  competency_id: number
  competency: CompetencyTypes
  compentency_items: CompetencyItemTypes[]
}
export interface IpcrfTemplatesObjectives {
  id: number
  created_at: string
  ipcrf_template_id: number
  objective_id: number
  objective: KraObjectiveTypes
  timeline: string
  weight: number
  target: string
  quality: boolean
  efficiency: boolean
  timeliness: boolean
  quality_outstanding: string
  quality_very_satisfactory: string
  quality_satisfactory: string
  quality_unsatisfactory: string
  quality_poor: string
  efficiency_outstanding: string
  efficiency_very_satisfactory: string
  efficiency_satisfactory: string
  efficiency_unsatisfactory: string
  efficiency_poor: string
  timeliness_outstanding: string
  timeliness_very_satisfactory: string
  timeliness_satisfactory: string
  timeliness_unsatisfactory: string
  timeliness_poor: string
}
export interface IpcrfTypes {
  id: number
  user_id: string
  rater_id: string
  ipcrf_template_id: number
  template: IpcrfTemplatesTypes
  description: string
  rater: Employee
  ratee: Employee
}
export interface IpcrfRatingTypes {
  id: number
  created_at: string
  ipcrf_id: number
  objective_id: number
  objective: KraObjectiveTypes
  timeline: string
  weight: number
  target: string
  quality: boolean
  efficiency: boolean
  timeliness: boolean
  quality_rating_1: number
  efficiency_rating_1: number
  timeliness_rating_1: number
  quality_rating_2: number
  efficiency_rating_2: number
  timeliness_rating_2: number
  quality_outstanding: string
  quality_very_satisfactory: string
  quality_satisfactory: string
  quality_unsatisfactory: string
  quality_poor: string
  efficiency_outstanding: string
  efficiency_very_satisfactory: string
  efficiency_satisfactory: string
  efficiency_unsatisfactory: string
  efficiency_poor: string
  timeliness_outstanding: string
  timeliness_very_satisfactory: string
  timeliness_satisfactory: string
  timeliness_unsatisfactory: string
  timeliness_poor: string
}
export type RaterType = 'self' | 'rater'

export interface IpcrfObjectiveRating {
  id: number
  ipcrf_id: number
  template_objective_id: number
  rater_type: RaterType
  period: 1 | 2
  quality?: number
  efficiency?: number
  timeliness?: number
}

export interface IpcrfCompetencyRating {
  id: number
  ipcrf_id: number
  competency_item_id: number
  competency_item: CompetencyItemTypes
  rater_type: RaterType
  period: 1 | 2
  item_ids: number[]
}
