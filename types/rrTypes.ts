import { Employee } from '.'

export interface RrRanking {
  id: number
  title: string
  description?: string
  created_at: string
}

export interface RrCriterion {
  id: number
  ranking_id: number
  name: string
  description?: string
  weight: number
  created_at: string
}

export interface RrCandidate {
  id: number
  ranking_id: number
  employee_id: string // uuid from hrm_users
  candidate: Employee
  created_at: string
}

export interface RrRater {
  id: number
  user_id: string // uuid from hrm_users
  rater: Employee
  created_at: string
}

export interface RrRating {
  id: number
  rater_id: number
  ranking_id: number
  candidate_id: number
  criterion_id: number
  points: number
  created_at: string
  updated_at: string
}
