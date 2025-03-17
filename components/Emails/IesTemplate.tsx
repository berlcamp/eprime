import { ApplicantTypes, RankingTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

interface ListTypes {
  applicant: ApplicantTypes
  accumulated_points: Record<string, number> | null
  overall_score: string
  ranking: RankingTypes
}

interface IesTemplateProps {
  applicantData: ListTypes
}

export const IesTemplate: React.FC<Readonly<IesTemplateProps>> = ({
  applicantData
}) => {
  //

  return (
    <div>
      <div
        style={{
          padding: '8px 0',
          borderBottom: '1px solid black',
          textAlign: 'center'
        }}
      >
        <div>Republic of the Philippines</div>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
          Department of Education
        </div>
        <div>Caraga Region</div>
        <div style={{ fontWeight: 'bold' }}>
          SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
        </div>
      </div>
      <br />
      <br />
      <div>{format(new Date(), 'MMMM d, yyyy')}</div>
      <br />
      <div style={{ fontWeight: 'bold' }}>{`${
        applicantData.applicant.firstname
      } ${applicantData.applicant.middlename ?? ''} ${
        applicantData.applicant.lastname
      }`}</div>
      <div style={{ fontWeight: 'bold' }}>
        {applicantData.applicant.address}
      </div>
      <div
        style={{ fontWeight: 'bold' }}
      >{`${applicantData.applicant.ranking?.position?.name} - ${applicantData.applicant.ranking?.type} - ${applicantData.applicant.ranking?.year}`}</div>
      <br />
      <br />
      <div>
        Dear{' '}
        <span style={{ fontWeight: 'bold' }}>{`${
          applicantData.applicant.firstname
        } ${applicantData.applicant.middlename ?? ''} ${
          applicantData.applicant.lastname
        }`}</span>
        ,
      </div>
      <br />
      <div>Good Day!</div>
      <br />
      <br />
      <div>
        We would like to inform you that the ranking process for{' '}
        {applicantData.ranking.position.name}-
        {applicantData.applicant.ranking?.type}-{applicantData.ranking.year},
        for which you had applied, has concluded, and the results have been
        finalized.
      </div>
      <div>
        Please visit the link provided for your Individual Evaluation Sheet
        (IES). Kindly review it and follow these steps:
      </div>
      <br />
      <div style={{ paddingLeft: '20px' }}>
        <div>
          1. Download and print your{' '}
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/rankingies/${
              applicantData.applicant.id
            }`}
            style={{ color: 'blue' }}
          >
            Individual Evaluation Sheet (IES).
          </a>
        </div>
        <div>2. Sign the document as confirmation.</div>
        <div>
          3. Resend the signed IES to depedbayugancity.hr@gmail.com with the
          subject:
        </div>
        <div style={{ fontWeight: 'bold' }}>
          "IES Confirmation - [Your Full Name]"
        </div>
      </div>
      <br />
      <br />
      <div>
        Should you have any concerns or inquiries, please do not hesitate to
        reach out.
      </div>
      <br />
      <div>Thank you.</div>
      <br />
      <br />
      <div>Very truly yours,</div>
      <br />
      <div>JASMINE B. NEPA</div>
      <div>Administrative Officer IV, HRMO</div>
      <br />
      <div>This is a system generated email. No signature is required.</div>
    </div>
  )
}
