/* eslint-disable @next/next/no-img-element */
import { ApplicantTypes } from "@/types";
import { format } from "date-fns";
import * as React from "react";
import { PrintFooter } from "./PrintFooter";
import { PrintHeader } from "./PrintHeader";

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes;
}

/**
 * CS Form No. 33-A (Revised 2018): Appointment Form - Regulated
 * Civil Service Commission standard format for government appointments.
 * Two-page layout per CSC requirements.
 */
export const PrintAppointmentForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props;

  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    "N/A";
  const salaryGrade =
    selectedItem?.ranking?.position?.salary_grade ||
    selectedItem?.hrm_item?.salary_grade ||
    selectedItem?.hrm_item?.hrm_position?.salary_grade ||
    "______";
  const fullName = `${selectedItem.firstname} ${selectedItem.middlename} ${selectedItem.lastname}`;
  const address = selectedItem?.address || "________________";
  const assignment =
    selectedItem?.assignment || "Schools Division Office of Bayugan City";
  const employmentStatus = selectedItem?.employment_status || "Permanent";
  const natureOfAppointment =
    selectedItem?.nature_of_appointment || "Original";
  const effectiveDate = selectedItem?.date
    ? format(new Date(selectedItem.date), "MMMM d, yyyy")
    : "________________";

  return (
    <div
      className="fixed left-[-9999px] top-0 w-[816px] print:left-0 print:relative print:m-0"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <div
        ref={ref}
        className="w-[816px] bg-white py-2 px-8 m-12 print:m-0 print:p-0 print:pb-36 text-[14px]"
        style={{ fontFamily: "Times New Roman, serif" }}
      >
        {/* ==================== PAGE 1 ==================== */}
        <div className="print:break-after-page">
          {/* Form identifier - upper left */}
          <div className="text-[11px] leading-tight mb-1">
            <div>CS Form No. 33-A (Revised 2018)</div>
            <div>Appointment Form - Regulated</div>
          </div>

          <PrintHeader />

          {/* Appointment clause */}
          <div className="mt-6 text-justify leading-relaxed space-y-4">
            <p className="indent-8">
              In accordance with the provisions of Section 8 (g), Article IX-B of
              the 1987 Philippine Constitution, pertinent civil service laws,
              rules and regulations, and the provisions of the Local Government
              Code of 1991 (Republic Act No. 7160), I/We hereby appoint:
            </p>
          </div>

          {/* Appointee details table */}
          <table className="mt-4 w-full text-[14px] border-collapse">
            <tbody>
              <tr>
                <td className="py-1.5 align-top w-40 font-medium">
                  Name:
                </td>
                <td className="py-1.5 border-b border-black">
                  <span className="font-bold">
                    {selectedItem.lastname}, {selectedItem.firstname}{" "}
                    {selectedItem.middlename}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-1.5 align-top font-medium">Address:</td>
                <td className="py-1.5 border-b border-black">{address}</td>
              </tr>
              <tr>
                <td className="py-1.5 align-top font-medium">
                  Position Title:
                </td>
                <td className="py-1.5 border-b border-black">{positionName}</td>
              </tr>
              <tr>
                <td className="py-1.5 align-top font-medium">
                  Salary Grade:
                </td>
                <td className="py-1.5 border-b border-black">{salaryGrade}</td>
              </tr>
              <tr>
                <td className="py-1.5 align-top font-medium">
                  Employment Status:
                </td>
                <td className="py-1.5 border-b border-black">
                  {employmentStatus}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 align-top font-medium">
                  Nature of Appointment:
                </td>
                <td className="py-1.5 border-b border-black">
                  {natureOfAppointment}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 align-top font-medium">
                  Place of Assignment:
                </td>
                <td className="py-1.5 border-b border-black">
                  {assignment}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 align-top font-medium">
                  Effective Date:
                </td>
                <td className="py-1.5 border-b border-black">
                  {effectiveDate}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Authority clause */}
          <div className="mt-6 text-justify leading-relaxed">
            <p className="indent-8">
              This appointment is issued pursuant to existing civil service
              rules and regulations, subject to the conditions prescribed
              thereof.
            </p>
          </div>

          {/* Signatory - Appointing Authority */}
          <div className="mt-12 flex justify-end">
            <div className="text-center min-w-[220px]">
              <div className="font-bold border-b-2 border-black pb-1">
                MA. TERESA M. REAL
              </div>
              <div className="text-[12px] mt-1">Schools Division Superintendent</div>
              <div className="text-[11px] italic mt-0.5">
                Appointing Authority
              </div>
              <div className="text-[12px] mt-3">
                Date: {effectiveDate}
              </div>
            </div>
          </div>

          <div className="mt-6 text-[11px] text-justify">
            <strong>Note:</strong> This appointment shall remain in force and
            in effect until revoked or otherwise terminated in accordance with
            law. The appointee is required to take an Oath of Office (CS Form
            No. 32) and file a Certificate of Assumption to Duty (CS Form No. 4)
            within fifteen (15) days from receipt of appointment.
          </div>
        </div>

        {/* ==================== PAGE 2 ==================== */}
        <div className="mt-8">
          {/* Form identifier */}
          <div className="text-[11px] leading-tight mb-2">
            <div>CS Form No. 33-A (Revised 2018)</div>
            <div>Appointment Form - Regulated (Page 2)</div>
          </div>

          <div className="text-center font-bold text-base mb-4">
            CERTIFICATIONS
          </div>

          {/* Certification 1: Availability of Funds */}
          <div className="space-y-2 mb-6">
            <div className="text-justify leading-relaxed">
              <p className="indent-8">
                This is to certify that the amount necessary to cover the
                salary and authorized allowances of{" "}
                <span className="font-bold">{fullName}</span> as{" "}
                <span className="font-bold">{positionName}</span> (SG{" "}
                {salaryGrade}) is available in the annual budget for the
                current year under the corresponding expense account.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="text-center min-w-[200px]">
                <div className="border-b-2 border-black h-6" />
                <div className="text-[12px] mt-1">
                  Authorized Official (Accountant)
                </div>
                <div className="text-[11px]">Date: _______________</div>
              </div>
            </div>
          </div>

          {/* Certification 2: HRMO Attestation */}
          <div className="space-y-2 mb-6">
            <div className="text-justify leading-relaxed">
              <p className="indent-8">
                This is to certify that the above-named appointee meets all the
                minimum qualification requirements and appropriate eligibility
                prescribed for the position; that the position is included in
                the approved Plantilla of Personnel; and that the supporting
                papers are complete and properly accomplished.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="text-center min-w-[200px]">
                <div className="font-bold border-b-2 border-black pb-1">
                  JASMINE B. NEPA
                </div>
                <div className="text-[12px] mt-1">
                  Administrative Officer IV - HRMO
                </div>
                <div className="text-[11px] italic mt-0.5">
                  Human Resource Management Officer
                </div>
                <div className="text-[12px] mt-3">Date: _______________</div>
              </div>
            </div>
          </div>

          {/* Certification 3: CSC Submission */}
          <div className="space-y-2 mb-4">
            <div className="text-justify leading-relaxed text-[13px]">
              <p className="indent-8">
                <strong>Distribution:</strong> Appointee / 201 File / Admin /
                COA / CSC Field Office (within thirty (30) days from date of
                assumption)
              </p>
            </div>
          </div>

          {/* Appointee conforme */}
          <div className="mt-8 pt-4 border-t border-gray-400">
            <div className="text-[13px]">
              <strong>Acknowledgment of Receipt:</strong>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div className="flex-1">
                <div className="border-b-2 border-black w-48 h-6" />
                <div className="text-[11px] mt-1">Signature of Appointee</div>
              </div>
              <div>
                <div className="border-b-2 border-black w-32 h-6" />
                <div className="text-[11px] mt-1">Date</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] italic">
              I acknowledge receipt of a copy of this appointment.
            </div>
          </div>
        </div>

        <PrintFooter />
      </div>
    </div>
  );
});
