import * as React from 'react'

interface RequestParamTypes {
  position: string
  code: string
  firstname: string
  middlename: string
  lastname: string
}

export const QualifiedApplicantTemplate: React.FC<
  Readonly<RequestParamTypes>
> = ({ position, code }) => {
  const body1a = `We confirm receipt of your application for ${position} with Application Number [${code}]. To complete your application, please uploaded supporting document using the link below:`
  const body1b = `${
    process.env.NEXT_PUBLIC_BASE_URL ?? ''
  }/applicantstatus?code=${code}`
  const body2 =
    'Should you need any assistance, feel free to connect with the HR office or any of the HR staff.  Good luck to your application and God speed.'
  const body3 = 'Best regards,'
  const body4 = 'HRM-PSB'
  const body5 = 'Deped Bayugan City Division'
  return (
    <div>
      <div>
        <div>Republic of the Philippines</div>
        <div>Department of Education</div>
        <div>Caraga Region</div>
        <div>SCHOOLS DIVISION OFFICE OF BAYUGAN CITY</div>
      </div>
      <br />
      <div>{body1a}</div>
      <br />
      <div>{body1b}</div>
      <br />
      <div>{body2}</div>
      <br />
      <div>{body3}</div>
      <div>{body4}</div>
      <div>{body5}</div>
    </div>
  )
}
