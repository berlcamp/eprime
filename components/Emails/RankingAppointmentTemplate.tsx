import * as React from 'react'

interface RequestParamTypes {
  position: string
  type: string
  code: string
  firstname: string
  middlename: string
  lastname: string
}

export const RankingAppointmentTemplate: React.FC<
  Readonly<RequestParamTypes>
> = ({ firstname, middlename, lastname, position, type, code }) => {
  return (
    <div>
      <div>
        Dear {firstname} {middlename} {lastname} - {code} - {position}-${type},
      </div>
      <br />
      <div>Greetings!</div>
      <br />
      <div>
        We are pleased to inform you that after careful evaluation and
        deliberation of your qualifications during the ranking and selection
        process, you have been appointed to the position of {position} at
        Department of Education - Bayugan City Division.
      </div>
      <br />
      <div>
        Your dedication, competence, and commitment to the Department{"'"}s
        vision of delivering quality, accessible, relevant, and liberating basic
        education have been duly recognized. We are confident that you will
        continue to uphold the standards of excellence expected in this role and
        contribute meaningfully to the success of our learners.
      </div>
      <br />
      <div>
        Please coordinate with the Division Office - HR Personnel for the
        processing of your appointment papers and the schedule of your
        assumption to duty.
      </div>
      <br />
      <div>
        Once again, congratulations on this well-deserved appointment. We look
        forward to your continued service and excellence in the Department.
      </div>
      <br />
      <div>Best regards,</div>
      <br />
      <div>Ma Teresa M. Real</div>
      <div>OIC-Schools Division Superintendent</div>
      <div>Bayugan City DivisionDepartment of Education</div>
    </div>
  )
}
