import type { MouseEventHandler, ReactNode } from 'react'

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
  hrm_user: Employee
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
  hrm_users?: Employee
}

export interface Office {
  id: string
  name: string
  head_user_id: string
  hrm_users?: Employee
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
  hrm_users?: Employee
}

export interface PositionTypes {
  id: string
  name: string
  type: string
  salary_grade: string
  org_id: string
  qualifications: Array<{ id?: string; name: string; description: string }>
}

export interface PositionQualificationTypes {
  id: string
  name: string
  description: string
  position_id: string
}

export interface ImplementingUnitTypes {
  id: string
  name: string
}

export interface SignatoriesTypes {
  prepared_by?: string
  prepared_by_position?: string
  truly_yours?: string
  truly_yours_position?: string
  recommending_1?: string
  recommending_1_position?: string
  recommending_2?: string
  recommending_2_position?: string
  approval?: string
  approval_position?: string
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
  gender: string
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
  item_id: string
  avatar_url: string
  hrm_schools?: SchoolTypes
  hrm_districts?: DistrictTypes
  hrm_offices?: Office
  hrm_assignments: AssignmentTypes[]
  hrm_designations: DesignationTypes[]
  hrm_leave_cards: LeaveCardTypes[]
  hrm_positions?: PositionTypes
  hrm_item?: ItemTypes
  joining_date: string
  birthday: string
  date_of_last_promotion: string
  date_of_next_step_increment: string
  step_increment_leave_days: string
  date_of_last_designation: string
  confirmed: string
  date_of_next_increment: string
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
  updater?: Employee
}

export interface LeaveCreditTypes {
  id: string
  position_type: string
  gender: string
  type: string
  credits: number
  date_of_next_increment: string
  date_of_next_reset: string
  user_id: string
  employee: Employee
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

export interface SalaryGradeTypes {
  id: string
  grade: string
  step: string
  salary: string
  logs: Array<{
    date: string // Represents the date and time as a string in the given format
    user_name: string // Represents the name of the user
    message: string // Represents the update message
  }>
}

export interface ItemTypes {
  id: string
  item_number: string
  user_id: string
  position_id: string
  implementing_unit_id?: string
  implementing_unit: ImplementingUnitTypes
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
  track: string
  strand: string
}

export interface NosiTypes {
  id: string
  user_id: string
  hrm_user: Employee
  as_of_date: string
  effective_date: string
  previous_amount: string
  previous_grade: string
  previous_step: string
  new_amount: string
  new_grade: string
  new_step: string
  confirmed: string
  date: string
  reason: string
  other_reason: string
}

export interface RankingExpensesSummaryTypes {
  id: string
  particulars: string
  total_applicants: string
  unit_cost: string
  time_spent_per_applicant: string
  amount: string
  ranking_id: string
  ranking: RankingTypes
  confirmed: string
}

export interface NosaTypes {
  id: string
  user_id: string
  hrm_user: Employee
  as_of_date: string
  effective_date: string
  previous_amount: string
  previous_grade: string
  previous_step: string
  new_amount: string
  new_grade: string
  new_step: string
  confirmed: string
  date: string
  reason: string
  other_reason: string
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
  date_of_next_increment: string
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
  date_of_next_increment: string
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
  confirmed: string
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
  is_approved: boolean
  hrm_service_credit_users: ServiceCreditUserTypes[]
  confirmed: string
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
  days_without_pay: string
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
  leave_credit_use_vl: string
  leave_credit_use_sl: string
  leave_credit_use_coc: string
  leave_credit_use_sc: string
  leave_credit_use_adoption: string
  leave_credit_use_vawc: string
  leave_credit_use_emergency: string
  leave_credit_use_study: string
  leave_credit_use_soloparent: string
  leave_credit_use_slbw: string
  leave_credit_use_spl: string
  leave_credit_use_rehab: string
  leave_credit_use_paternity: string
  leave_credit_use_maternity: string
  leave_days_with_pay: string
  leave_days_without_pay: string

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

export interface PdsPersonalInfomationTypes {
  firstname: string
  middlename: string
  lastname: string
  ext: string
  birthday: string
  place_of_birth: string
  gender: string
  civil_status: string
  height: string
  weight: string
  blood_type: string
  citizenship: string
  telephone: string
  mobile_number: string
  residential_house_no: string
  residential_street: string
  residential_subdivision: string
  residential_barangay: string
  residential_city: string
  residential_province: string
  residential_zip: string
  permanent_house_no: string
  permanent_street: string
  permanent_subdivision: string
  permanent_barangay: string
  permanent_city: string
  permanent_province: string
  permanent_zip: string
  gsis_no: string
  pagibig_no: string
  philhealth_no: string
  sss_no: string
  tin_no: string
  agency_employee_no: string
  confirmed: string
}

export interface PdsFamilyBackgroundTypes {
  spouse_firstname: string
  spouse_middlename: string
  spouse_lastname: string
  spouse_ext: string
  spouse_occupation: string
  spouse_employer: string
  spouse_business_address: string
  spouse_business_telephone: string
  father_firstname: string
  father_middlename: string
  father_lastname: string
  father_ext: string
  mother_firstname: string
  mother_middlename: string
  mother_lastname: string
  confirmed: string
}

export interface RankingTypes {
  id: string
  type: string
  position_id: string
  position: PositionTypes
  chairman_id: string
  chairman: Employee
  department: string
  year: string
  description: string
  display_ier: string
  display_rqa: string
  display_ranklist: string
  display_nai: string
  days_to_comply: string
  has_qualification_standard: string
  qualifications: Array<{
    id?: string
    name: string
    description: string
    required: boolean
  }>
  status: string
  passing_score: string
  display_on_portal: string
  display_on_portal_from: string
  display_on_portal_until: string
  committees: RankingCommitteeTypes[]
  applicants: ApplicantTypes[]
  confirmed: string
}

export interface RankingQualifications {
  id: string
  ranking_id: string
  name: string
  description: string
  required: string
}
export interface ApplicantTypes {
  id: string
  type: string
  user_id: string
  employee: Employee
  current_employee: string
  previous_applicant: string
  previous_applicant_code: string
  lastname: string
  firstname: string
  middlename: string
  email: string
  files: Array<FileList | undefined>
  address: string
  age: string
  sex: string
  civil_status: string
  religion: string
  disability: string
  ethnicity: string
  ethnicity_detail: string
  solo_parent: string
  solo_parent_detail: string
  contact_number: string
  specific_major: string

  deped_email: string
  retype_email: string
  ranking_id: string
  code: string
  status: string
  confirmed: string
  documents: File[][]
  ranking: RankingTypes
  applicant_documents: ApplicantDocuments[]
  qualifications: Array<{ id?: string; name: string; files: [] }>
}

export interface ApplicantDocuments {
  id: string
  ranking_id: string
  qualification_id: string
  qualification: RankingQualifications
  document_url: string
  status: string
  remarks: string
  created_at: string
}

export interface ApplicantIerTypes {
  id: string
  ranking_id: string
  qualification_id: string
  remarks: string
  time: string
}

export interface AnnouncementTypes {
  id: string
  title: string
  description: string
}

export interface RankingCriteriaTypes {
  id: string
  name: string
  points: string
  type: string
  ranking_id: string
  committees?: RankingCommitteeTypes[]
}

export interface RankingCriteriaPoints {
  id: string
  applicant_id: string
  committee_criteria_id: string
  points: string
  cast: Array<{
    commmittee_criteria_id: number
    points: number
  }>
}

export interface RankingCommitteeCriteriaTypes {
  id: string
  committee_id: string
  criteria_id: string
  criteria: RankingCriteriaTypes
  criteria_points: RankingCriteriaPoints[]
}

export interface RankingCommitteeTypes {
  id: string
  user_id: string
  hrm_user: Employee
  ranking_id: string
  type: string
  criteria_ids?: string[]
  committee_criterias?: RankingCommitteeCriteriaTypes[]
}

export interface RankingEvaluatorTypes {
  id: string
  user_id: string
  hrm_user: Employee
  ranking_id: string
}
