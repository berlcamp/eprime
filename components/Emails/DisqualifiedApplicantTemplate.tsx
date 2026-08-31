import { ApplicantIerTypes, ApplicantTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

export const DisqualifiedApplicantTemplate = (
  applicant: Readonly<ApplicantTypes>,
  ier: ApplicantIerTypes[] | null
): React.ReactElement => {
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
      <div>
        Please be informed of the results of the initial evaluation of your
        qualifications vis-à-vis the Civil Service Commission (CSC)
        approved-Qualification Standards (QS) of{' '}
        {applicant.ranking?.position?.name} position under DEPED Bayugan City
        Division, as follows:
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
                    {ierData?.filter((l) => l.type === type).map((l, i) => (
                          <div key={i}>{`${i + 1}. ${l.remarks} - ${
                            l.time
                          }`}</div>
                        ))}
                  </td>
                  <td>
                    {ierData?.filter((l) => l.type === type).map((l, i) => (
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
        While your qualifications made a favorable impression, we regret to
        inform you that you did not meet the minimum QS set for Attorney
        IIIposition. You may, however, continue to submit job applications in
        response to other vacancy announcements that we publish at
        www.csc.gov.ph/careers, DepEd bulletin boards, and official website.
      </div>
      <br />
      <div>
        The results of the initial evaluation shall be released and posted for
        transparency purposes. You may refer to your assigned application code
        [RKXDV] in the official posting of the results.
      </div>
      <br />
      <div>
        Thank you and we wish you the best of luck in your future success.
      </div>
      <br />
      <div>
        Postscript: If you wish to submit additional qualifications to address
        your disqualification, you have until to provide, resubmit, or comply
        with the necessary minimum qualification standard requirements.
      </div>
      <br />
      <div>
        You may check your evaluation status and details through the "Check Your
        Application" feature in the system or by visiting the link below:
      </div>
      <div>
        {`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/applicantstatus?code=${
          applicant.code
        }`}
      </div>
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
