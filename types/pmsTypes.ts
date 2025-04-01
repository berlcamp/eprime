import { Employee, PositionTypes } from '.'
import { InterventionTypes } from './landTypes'

export interface KraTypes {
  id: string
  title: string
  is_archive: string
}
export interface KraObjectiveTypes {
  id: string
  title: string
  kra_id: string
  is_archive: string
  kra: KraTypes
  mov: string
}
export interface CompetencyTypes {
  id: string
  title: string
  type: string
  is_archive: string
  item_1: string
  item_2: string
  item_3: string
  item_4: string
  item_5: string
  competency_items: CompetencyItemTypes[]
  has_efficiency: string
  has_timeliness: string
  mov: string
}
export interface CompetencyItemTypes {
  id: string
  title: string
  competency_id: string
  competency: CompetencyTypes
  rating: string
}
export interface IpcrfTemplateTypes {
  id: string
  title: string
  positions: PositionTypes[]
  objectives: IpcrfObjectiveTypes[]
  competencies: CompetencyTypes[]
  is_archive: boolean
  is_published: boolean
}
export interface IpcrfObjectiveTypes {
  id: string
  kra_id: string
  title: string
  weight: string
  cot_1: boolean
  cot_2: boolean
  cot_3: boolean
  cot_4: boolean
  has_efficiency: boolean
  has_timeliness: boolean
  qPE1: string
  qPE2: string
  qPE3: string
  qPE4: string
  qPE5: string
  ePE1: string
  ePE2: string
  ePE3: string
  ePE4: string
  ePE5: string
  tPE1: string
  tPE2: string
  tPE3: string
  tPE4: string
  tPE5: string
  cot_1_rating?: string
  cot_2_rating?: string
  cot_3_rating?: string
  cot_4_rating?: string
  quality_rating?: string
  efficiency_rating?: string
  timeliness_rating?: string
  score?: string
}
export interface DevelopmentPlansTypes {
  id?: string
  strength_objective_id?: string
  weak_objective_id?: string
  strength_objective?: KraObjectiveTypes
  weak_objective?: KraObjectiveTypes
  strength_competency_id?: string
  weak_competency_id?: string
  strength_competency?: CompetencyTypes
  weak_competency?: CompetencyTypes
  intervention_id: string
  intervention?: InterventionTypes
  learning_objectives: string
  timeline: string
  resources_needed: string
  system_type?: string
  type?: string
  ipcrf_id?: string
}
export interface IpcrfTypes {
  id: string
  user_id: string
  user: Employee
  rater_user_id: string
  rater: Employee
  ipcrf_template_id: string
  ipcrf_template: IpcrfTemplateTypes
  positions: PositionTypes[]
  objectives: IpcrfObjectiveTypes[]
  competencies: CompetencyTypes[]
  score: string
  adjectival_rating: string
  status: string
}
