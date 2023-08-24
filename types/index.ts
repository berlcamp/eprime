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
  hrm_schools?: SchoolTypes
  hrm_districts?: DistrictTypes
  hrm_offices?: Office
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
