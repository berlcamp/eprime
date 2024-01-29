import type { ReactNode, MouseEventHandler } from 'react'

export interface SelectUserNamesProps {
  settingsData: any[]
  multiple: boolean
  type: string
  handleManagerChange: (newdata: any[], type: string) => void
  title: string
}

export interface UserAccessTypes {
  user_id: string
  type: string
  hrm_user: namesType
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
  position_type: string
  avatar_url: string
  id: string
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
  hrm_users?: namesType
}

export interface Office {
  id: string
  name: string
  head_user_id: string
  hrm_users?: namesType
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
  hrm_users?: namesType
}

export interface PositionTypes {
  id: string
  name: string
  type: string
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
  reference_table: string
  is_read: boolean
}

export interface Employee {
  id: string
  firstname: string
  middlename: string
  lastname: string
  password: string
  email: string
  status?: string
  position_id: number
  salary_grade: string
  salary_step: string
  position_type: string
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
  hrm_leave_cards: LeaveCardTypes[]
  hrm_positions?: PositionTypes
  joining_date: string
  birthday: string
  date_of_last_promotion: string
  date_of_last_designation: string
  confirmed: string
}

export interface LeaveCardTypes {
  id: string
  from: string
  to: string
  particulars: string
  credits_used: string
  credits_earned: string
  balance: string
  absence_with_pay: string
  absence_without_pay: string
  type: string
  transaction_type: string
  remarks: string
  user_id: string
  updated_by: string
  created_at: string
  adjustment_date: string
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
  service_record_status: string
}

export interface ItemTypes {
  id: string
  item_number: string
  user_id: string
  position_id: string
  implementing_unit_id?: string
  implementing_unit: SchoolTypes
  school_id?: string
  hrm_school: SchoolTypes
  hrm_position: PositionTypes
  hrm_user: Employee
  salary_grade: string
  vice: string
  sex: string
  birthday: string
  eligibility: string
  date_of_last_promotion: string
  date_of_original_appointment: string
  status: string
  authorized_annual_salary: string
  actual_annual_salary: string
  area_code: string
  area_type: string
  level: string
  tin_no: string
  umid_no: string
  confirmed: string
  vacancy_type: string
}

export interface PromotionTypes {
  id: string
  user_id: string
  item_id: string
  status: string
  effectivity_date: string
  hrm_item: ItemTypes
  hrm_user: Employee
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
  position_id: string
  hrm_positions: PositionTypes
  office_id: string
  hrm_schools: SchoolTypes
  hrm_districts: DistrictTypes
  hrm_offices: Office
  service_record_status: string
  confirmed: string
}

export interface RevokeTypes {
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
  service_record_status: string
  position_id: string
  hrm_positions: PositionTypes
  confirmed: string
}

export interface CtoUserTypes {
  id: string
  hrm_user_id: string
  hrm_ctos?: CtoTypes
  hrm_users: namesType
  cto_id: string
  is_approved: boolean
  expiration: string
  coc: number
  used_coc?: number
  status: string
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
  hrm_users: namesType
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
  is_approved: boolean
  hrm_service_credit_users: ServiceCreditUserTypes[]
}

export interface LeaveTypes {
  type: string
  location: string
  specify_location: string
  hospitalization: string
  illness: string
  women_illness: string
  study_purpose: string
  other_purpose: string
  days: string
  from: string
  to: string
  commutation: string
  confirmed: string
}

export interface TravelTypes {
  type: string
  purpose: string
  host: string
  from: string
  to: string
  destination: string
  fund_source: string
  confirmed: string
}

export interface PassSlipTypes {
  type: string
  intended_time_departure: string
  intended_time_arrival: string
  fixed_time_from: string
  fixed_time_to: string
  purpose: string
  reason: string
  confirmed: string
}

export interface ServiceRecordPrintRequestTypes {
  id: string
  purpose: string
  confirmed: string
}

export interface UndertimePermitTypes {
  id: string
  time: string
  reason: string
  confirmed: string
}

export interface LocatorSlipTypes {
  id: string
  purpose: string
  type: string
  date: string
  time: string
  destination: string
  confirmed: string
}

export interface ServiceRecordTypes {
  id: string
  user_id: string
  org_id: string
  from: string
  to: string
  designation: string
  status: string
  salary: string
  station: string
  branch: string
  assignment_id: string
  separation_date: string
  separation_cause: string
  remarks: string
  created_by: string
  hrm_user: Employee
}

export interface FlowListTypes {
  id: string
  tracker_id: string
  created_at: string
  user_id: string
  receiver_id: string
  status: string
  hrm_user: Employee
  receiver: Employee
  hrm_tracker_logs: TrackerLogsTypes[]
}

export interface DocTypes {
  id: string
  type: string
  shortcut: string
  isChecked?: boolean
}

export interface AttachmentTypes {
  id: string
  name: string
}

interface LogMessageTypes {
  field: string
  old_value: string
  new_value: string
}

export interface TrackerLogsTypes {
  tracker_flow_id: string
  created_at: string
  user_id: string
  message: string
  hrm_user: Employee
}

export interface LogTypes {
  id: string
  created_at: string
  document_tracker_id: string
  sender_id: string
  message: LogMessageTypes[]
  is_private: boolean
  parent_document_tracker_id: string
  reply_type: string
  hrm_users: Employee
}

export interface StickiesTypes {
  id: string
  document_tracker_id: string
  user_id: string
  note: string
  color: string
  tracker: DocumentTypes
}

export interface FollowersTypes {
  tracker_id: string
  user_id: string
}

export interface DocumentTypes {
  id: string
  type: string
  reference_code: string
  current_status: string
  current_tracker: string
  receiver_id: string
  current_approver_id: string
  date_created: string
  leave_type: string
  leave_location: string
  leave_specify_location: string
  leave_hospitalization: string
  leave_illness: string
  leave_women_illness: string
  leave_study_purpose: string
  leave_other_purpose: string
  leave_days: string
  leave_from: string
  leave_to: string
  leave_commutation: string
  locator_slip_purpose: string
  locator_slip_type: string
  locator_slip_date: string
  locator_slip_time: string
  locator_slip_destination: string
  service_record_print_request_purpose: string
  pass_slip_type: string
  pass_slip_intended_time_departure: string
  pass_slip_intended_time_arrival: string
  pass_slip_fixed_time_from: string
  pass_slip_fixed_time_to: string
  pass_slip_purpose: string
  pass_slip_reason: string
  travel_type: string
  travel_purpose: string
  travel_host: string
  travel_from: string
  travel_to: string
  travel_destination: string
  travel_fund_source: string
  undertime_permit_time: string
  undertime_permit_reason: string
  particulars: string
  date_received: string
  created_at: string
  created_by: string
  hrm_remarks: RemarksTypes[]
  creator: Employee
  receiver: Employee
  approver: Employee
  hrm_tracker_followers: FollowersTypes[]
  hrm_request_tracker_stickies: StickiesTypes[]
}

export interface RemarksTypes {
  id: string
  created_at: string
  document_tracker_id: string
  sender_id: string
  message: string
  is_private: boolean
  reply_type: string
  files: string[] | null
  hrm_users: Employee
  hrm_remarks_comments: CommentsTypes[]
}

export interface GlobalRemarksTypes {
  id: string
  created_at: string
  sender_id: string
  promotion_id?: string
  message: string
  hrm_users: Employee
}

export interface CommentsTypes {
  id: string
  created_at: string
  remarks_id: string
  sender_id: string
  message: string
  hrm_users: Employee
  hrm_remarks: RemarksTypes
}

export interface CommentDataTypes {
  id: string
  created_at: string
  sender_id: string
  message: string
  hrm_users: Employee
}
