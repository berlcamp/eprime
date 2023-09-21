import type { ReactNode, MouseEventHandler } from 'react'

export interface SelectUserNamesProps {
  settingsData: any[]
  multiple: boolean
  type: string
  handleManagerChange: (newdata: any[], type: string) => void
  title: string
}

export interface searchUser {
  firstname: string
  middlename: string
  lastname: string
  uuid?: string
  id: string
}

export interface namesType {
  firstname: string
  middlename: string
  lastname: string
  uuid?: string
  id: string
}

export interface settingsDataTypes {
  access_type: string
  data: namesType
}

export interface CustomButtonTypes {
  isDisabled?: boolean
  btnType?: 'button' | 'submit'
  containerStyles?: string
  textStyles?: string
  title: string
  rightIcon?: ReactNode
  handleClick?: MouseEventHandler<HTMLButtonElement>
}

export interface DistrictTypes {
  id: string
  name: string
  head_user_id: string
  hrm_users?: any
}

export interface Office {
  id: string
  name: string
  head_user_id: string
  hrm_users?: any
}

export interface SchoolTypes {
  id: string
  name: string
  type: string
  school_class: never[] | []
  size: string
  school_id: string
  district_id: string
  head_user_id: string
  hrm_users?: any
}

export interface PositionTypes {
  id: string
  name: string
  salary_grade: string
  org_id: string
}

export interface NotificationTypes {
  id: string
  message: string
  created_at: string
  url: string
  type: string
  user_id: string
  reference_id?: string
  is_read: boolean
}

export interface Employee {
  id: string
  firstname: string
  middlename: string
  lastname: string
  password: string
  email: string
  position_id: number
  salary_grade: string
  salary_step: string
  assignment: string
  district_id: string
  org_id: string
  school_id: string
  office_id: string
  avatar_url: string
  hrm_schools?: SchoolTypes
  hrm_districts?: DistrictTypes
  hrm_offices?: Office
  hrm_assignments: AssignmentTypes[]
  hrm_designations: DesignationTypes[]
  hrm_positions?: PositionTypes
}

export interface AccountDetailsForm {
  firstname: string
  middlename: string
  lastname: string
  email: string
  position_id?: string
  salary_grade?: string
  salary_step?: string
  assignment?: string
  district_id?: string
  school_id?: string
  office_id?: string
}

export interface AssignmentTypes {
  reference_code: string
  hrm_user_id: string
  id: string
  area_assigned: string
  from: string
  to: string
  type: string
  status: string
  add_to_service_record: boolean
  hrm_users: Employee
  district_id: string
  school_id: string
  position_id: string
  office_id: string
  hrm_schools: SchoolTypes
  hrm_districts: DistrictTypes
  hrm_offices: Office
  hrm_positions: PositionTypes
}

export interface DesignationTypes {
  reference_code: string
  hrm_user_id: string
  id: string
  area_assigned: string
  from: string
  to: string
  type: string
  status: string
  add_to_service_record: boolean
  add_to_leave_card: boolean
  hrm_users: Employee
  district_id: string
  school_id: string
  designation: string
  office_id: string
  hrm_schools: SchoolTypes
  hrm_districts: DistrictTypes
  hrm_offices: Office
}

export interface CtoUserTypes {
  id: string
  hrm_user_id: string
  hrm_ctos?: CtoTypes
  hrm_users: Employee
  cto_id: string
  is_approved: boolean
  expiration: string
  coc: number
  used_coc?: number
}

export interface CtoTypes {
  reference_code: string
  id: string
  from: string
  to: string
  status: string
  date_issued: string
  expiration: string
  hours: string
  days: string
  total_hours: string
  particulars: string
  coc: string
  is_holiday: boolean
  hrm_cto_users?: CtoUserTypes[]
}

export interface excludedItemsTypes {
  id: string
}

export interface ServiceCreditUserTypes {
  id: string
  hrm_user_id: string
  hrm_service_credits?: ServiceCreditTypes
  hrm_users: Employee
  service_credit_id: string
  is_approved: boolean
  service_credits: number
  used_service_credits?: number
}

export interface ServiceCreditTypes {
  reference_code: string
  id: string
  from: string
  to: string
  status: string
  date_issued: string
  hours: string
  days: string
  total_hours: string
  particulars: string
  service_credits: string
  hrm_service_credit_users: ServiceCreditUserTypes[]
}

export interface LeaveTypes {
  id: string
  reference_code: string
  requester_id: string
  requester: Employee
  recommending_id: string
  recommending: namesType
  hr_id: string
  hr: namesType
  approver_id: string
  approver: namesType
  location: string
  abroad: string
  hospitalization: string
  illness: string
  study_purpose: string
  other_purpose: string
  from: string
  to: string
  days: string
  type: string
  recommending_status: string
  hr_status: string
  approver_status: string
  recommending_disapproval_reason: string
  hr_disapproval_reason: string
  approver_disapproval_reason: string
}
