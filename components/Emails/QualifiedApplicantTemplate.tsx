import { ApplicantIerTypes, ApplicantTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

export const QualifiedApplicantTemplate: React.FC<Readonly<ApplicantTypes>> = (
  applicant,
  ier
) => {
  //
  const ierData: ApplicantIerTypes[] | null = ier

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
      <div>{format(new Date(), 'MMMM d, yyyy')}</div>
      <br />
      <div style={{ fontWeight: 'bold' }}>{`${applicant.firstname} ${
        applicant.middlename ?? ''
      } ${applicant.lastname}`}</div>
      <div style={{ fontWeight: 'bold' }}>{applicant.address}</div>
      <div style={{ fontWeight: 'bold' }}>{`${applicant.firstname} ${
        applicant.middlename ?? ''
      } ${applicant.lastname}`}</div>
      <div
        style={{ fontWeight: 'bold' }}
      >{`${applicant.ranking?.position?.name} - ${applicant.ranking?.type} - ${applicant.ranking?.year}`}</div>
      <br />
      <br />
      <div>
        Dear{' '}
        <span style={{ fontWeight: 'bold' }}>{`${applicant.firstname} ${
          applicant.middlename ?? ''
        } ${applicant.lastname}`}</span>
        ,
      </div>
      <br />
      <div>Congratulations!</div>
      <br />
      <div>
        We are pleased to inform you that based on the initial evaluation, we
        have found your qualifications to be substantial vis-à-vis the Civil
        Service Commission (CSC) approved Qualification Standards (QS) of{' '}
        {applicant.ranking?.position?.name} position under DEPED Bayugan City
        Division. Below are the results of the initial evaluation conducted by
        the undersigned.
      </div>
      <br />
      <div>
        <table
          border={1}
          cellPadding={5}
          cellSpacing={0}
          style={{ borderCollapse: 'collapse', width: '100%' }}
        >
          <thead>
            <tr>
              <th>Position Applied for</th>
              <th>CSC-approved QS of the Position</th>
              <th>Your Qualifications</th>
              <th>Remarks/Details</th>
            </tr>
          </thead>
          <tbody>
            {['Education', 'Experience', 'Training', 'Eligibility'].map(
              (type, index) => (
                <tr key={index}>
                  {index === 0 && (
                    <td rowSpan={4}>{applicant.ranking?.position?.name}</td>
                  )}
                  <td>{type}:</td>
                  <td>
                    {ierData
                      ?.filter((l) => l.type === type)
                      .map((l, i) => (
                        <div key={i}>{`${i + 1}. ${l.remarks} - ${
                          l.time
                        }`}</div>
                      ))}
                  </td>
                  <td>
                    {ierData
                      ?.filter((l) => l.type === type)
                      .map((l, i) => (
                        <div key={i}>{`${i + 1}. ${l.status}`}</div>
                      ))}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <br />
      <div>
        Please be advised of your assigned application code {applicant.code}{' '}
        which shall be used as you proceed with the next stage of the selection
        process. You may refer to the official issuances of the DepEd Bayugan
        City Division for the additional announcements in this regard.
      </div>
      <br />
      <div>
        For inquiries, you may communicate with depedbayugancity.hr@gmail.com.
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
