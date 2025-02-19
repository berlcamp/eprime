import { ApplicantTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

export const QualifiedApplicantTemplate: React.FC<Readonly<ApplicantTypes>> = (
  applicant
) => {
  return (
    <div>
      <div className="py-2 border-b border-black">
        <div>Republic of the Philippines</div>
        <div>Department of Education</div>
        <div>Caraga Region</div>
        <div>SCHOOLS DIVISION OFFICE OF BAYUGAN CITY</div>
      </div>

      <br />
      <div>{format(new Date(), 'MMMM d, yyyy')}</div>
      <br />
      <div className="font-bold">
        {applicant.firstname} {applicant.middlename ?? ''} {applicant.lastname}
      </div>
      <div className="font-bold">{applicant.address}</div>
      <div className="font-bold">
        {applicant.firstname} {applicant.middlename ?? ''} {applicant.lastname}
      </div>
      <div className="font-bold">
        {applicant.ranking?.position?.name} - {applicant.ranking?.type} -{' '}
        {applicant.ranking?.year}
      </div>
      <br />
      <br />
      <div>
        Dear {applicant.firstname} {applicant.middlename ?? ''}{' '}
        {applicant.lastname},
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
        the undersigned dated {applicant.ranking?.display_on_portal_from}.
      </div>
      <br />
      <br />
      <div>
        <table>
          <thead>
            <tr>
              <th>Position Applied for</th>
              <th>CSC-approved QS of the Position</th>
              <th>Your Qualifications</th>
              <th>Remarks/Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={4}>{applicant.ranking?.position?.name}</td>
              <td>Education:</td>
              <td>Education:</td>
              <td>Remarks</td>
            </tr>
            <tr>
              <td>Experience:</td>
              <td>Experience:</td>
              <td>Remarks</td>
            </tr>
            <tr>
              <td>Training:</td>
              <td>Training:</td>
              <td>Remarks</td>
            </tr>
            <tr>
              <td>Eligibility:</td>
              <td>Eligibility:</td>
              <td>Remarks</td>
            </tr>
          </tbody>
        </table>
      </div>
      <br />
      <br />
      <div>
        While your qualifications made a favorable impression, we regret to
        inform you that you did not meet the minimum QS set for{' '}
        {applicant.ranking?.position?.name}
        position. You may, however, continue to submit job applications in
        response to other vacancy announcements that we publish at
        www.csc.gov.ph/careers, DepEd bulletin boards, and official website.
      </div>
      <br />
      <div>
        The results of the initial evaluation shall be released and posted for
        transparency purposes. You may refer to your assigned application code [
        {applicant.code}] in the official posting of the results.
      </div>
      <br />
      <div>
        Thank you and we wish you the best of luck in your future success.
      </div>
      <br />
      <div>
        <div className="font-bold">Postscript:</div>
        <div className="pl-10">
          If you wish to submit additional qualifications to address your
          disqualification, you have until{' '}
          {applicant.ranking?.display_on_portal_until} to provide, resubmit, or
          comply with the necessary minimum qualification standard requirements.
        </div>
        <br />
        <div className="pl-10">
          You may check your evaluation status and details through the "Check
          Your Application" feature in the system or by visiting the link below:
        </div>
        <div className="pl-10">{`${
          process.env.NEXT_PUBLIC_BASE_URL ?? ''
        }/applicantstatus?code=${applicant.code}`}</div>
      </div>
      <br />
      <br />
      <div>Very truly yours,</div>
      <br />
      <div>JASMINE B. NEPA</div>
      <div>Administrative Officer IV, HRMO</div>
      <br />
      <br />
      <div>This is a system generated email. No signature is required.</div>
    </div>
  )
}
