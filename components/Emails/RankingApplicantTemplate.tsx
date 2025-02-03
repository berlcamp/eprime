import * as React from 'react'

interface RequestParamTypes {
  position: string
  code: string
  firstname: string
  middlename: string
  lastname: string
}

export const RankingApplicantTemplate: React.FC<
  Readonly<RequestParamTypes>
> = ({ firstname, middlename, lastname, position, code }) => {
  const header = `Dear ${firstname} ${middlename} ${lastname},`
  const body1 = `We confirm receipt of your application for ${position} with Application Number [${code}]. Please keep this number for tracking your application status and for any queries related to your submission.`
  const body2 =
    'Should you need any assistance, feel free to connect with the HR office or any of the HR staff.  Good luck to your application and God speed.'
  const body3 = 'Best regards,'
  const body4 = 'HRM-PSB'
  const body5 = 'Deped Bayugan City Division'
  return (
    <div>
      <div>{header}</div>
      <br />
      <div>{body1}</div>
      <br />
      <div>{body2}</div>
      <br />
      <div>{body3}</div>
      <div>{body4}</div>
      <div>{body5}</div>
    </div>
  )
}
