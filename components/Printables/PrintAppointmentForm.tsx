/* eslint-disable @next/next/no-img-element */
import { useSupabase } from "@/context/SupabaseProvider";
import { ApplicantTypes } from "@/types";
import { format } from "date-fns";
import * as React from "react";
import { PrintHeader } from "./PrintHeader";

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes;
}

/**
 * CS Form No. 33-B (Revised 2018): Appointment Form - For Accredited/Deregulated Agencies
 * Matches the exact CSC official format as per the reference PDF.
 */
export const PrintAppointmentForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props;
  const { systemAccess, systemUsers } = useSupabase();

  const sdsAccess = systemAccess?.find(
    (a: { type: string }) => a.type === "sds",
  );
  const sdsUser = systemUsers?.find(
    (u: { id: string }) => u.id === sdsAccess?.user_id,
  );
  const sdsName = sdsUser
    ? `${sdsUser.firstname} ${sdsUser.middlename ?? ""} ${sdsUser.lastname}`.trim()
    : null;

  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    "N/A";
  const salaryGrade =
    selectedItem?.ranking?.position?.salary_grade ||
    selectedItem?.hrm_item?.salary_grade ||
    selectedItem?.hrm_item?.hrm_position?.salary_grade ||
    "______";
  const fullName = `${selectedItem.firstname} ${selectedItem.middlename ?? ""} ${selectedItem.lastname}`;
  const assignment =
    selectedItem?.assignment || "Schools Division Office of Bayugan City";
  const employmentStatus = (
    selectedItem?.employment_status || "Permanent"
  ).toUpperCase();
  const natureOfAppointment = (
    selectedItem?.nature_of_appointment || "Original"
  ).toUpperCase();
  const vice = selectedItem?.vice ?? "________________";
  const reasonOfVacancy = (
    selectedItem?.reason_of_vacancy ?? "________________"
  ).toUpperCase();
  const plantillaNumber = selectedItem?.plantilla_number ?? "________________";
  const salaryAmount = selectedItem?.salary_amount ?? "________________";
  const salaryInWords = (
    selectedItem?.salary_in_words ?? "________________"
  ).toUpperCase();
  const plantillaType =
    (selectedItem as ApplicantTypes & { plantilla_type?: string })
      ?.plantilla_type ?? "";
  const effectiveDate = selectedItem?.date
    ? format(new Date(selectedItem.date), "MMMM d, yyyy")
    : "________________";

  const salutation =
    selectedItem?.sex?.toLowerCase() === "male"
      ? "Mr."
      : selectedItem?.sex?.toLowerCase() === "female"
        ? "Ms."
        : "Mr./Mrs./Ms.";

  const isPromotion =
    (selectedItem?.nature_of_appointment || "").toLowerCase() === "promotion";

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
        <div className="print:break-after-page border-2 border-black p-4 mb-1 bg-gray-200">
          <div className="border-2 border-black p-4 mb-4 bg-white">
            {/* Top section: Form number left, Accredited box right, Stamp right */}
            <div className="flex justify-between items-start mb-1">
              <div className="text-[11px] leading-tight">
                <div className="font-bold">CS Form No. 33-B</div>
                <div>Revised 2018</div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-[10px] text-slate-500">
                  (Stamp of Date of Receipt)
                </div>
                <div className="border border-black px-3 py-1 text-[10px] font-medium">
                  For Accredited/Deregulated Agencies
                </div>
              </div>
            </div>

            <PrintHeader />

            {/* Appointment clause - exact format per CSC Form 33-B */}
            <div className="mt-4 text-justify leading-relaxed space-y-3">
              <p>
                {salutation}:{" "}
                <span className="font-bold underline underline-offset-1">
                  {fullName}
                </span>
              </p>
              <p>
                You are hereby appointed as{" "}
                <span className="font-bold underline underline-offset-1">
                  {positionName}
                </span>{" "}
                <span className="text-[12px]">(Position Title)</span>
                <span className="ml-2">(SG {salaryGrade}, Step 1)</span>
              </p>
              <p>
                under{" "}
                <span className="font-bold underline underline-offset-1">
                  {employmentStatus}
                </span>{" "}
                <span className="text-[12px]">
                  (Permanent, Temporary, etc.)
                </span>
                <br />
                status at the{" "}
                <span className="font-bold underline underline-offset-1">
                  {assignment.toUpperCase()}
                </span>
                .
              </p>
              <p className="text-[12px]">(Office/Department/Unit)</p>
              <p>
                with a compensation rate of{" "}
                <span className="font-bold underline underline-offset-1">
                  {salaryInWords}
                </span>{" "}
                pesos per month.
                <span className="ml-2">
                  (P{" "}
                  <span className="font-bold underline underline-offset-1">
                    {salaryAmount}
                  </span>
                  )
                </span>
              </p>
              <p>
                The nature of this appointment is{" "}
                <span className="font-bold underline underline-offset-1">
                  {natureOfAppointment}
                </span>{" "}
                <span className="text-[12px]">(Original, Promotion, etc.)</span>{" "}
                vice{" "}
                <span className="font-bold underline underline-offset-1">
                  {vice}
                </span>{" "}
                who{" "}
                <span className="font-bold underline underline-offset-1">
                  {reasonOfVacancy}
                </span>
              </p>
              <p className="text-[12px]">
                (Transferred, Retired, Promoted, etc.)
              </p>
              <p>
                with Plantilla Item No.{" "}
                <span className="font-bold underline underline-offset-1">
                  {plantillaNumber}
                </span>
              </p>
            </div>

            {/* Effective date clause */}
            <div className="mt-6 text-justify leading-relaxed">
              <p className="indent-8">
                This appointment shall take effect on the date of signing by the
                appointing officer/authority.
              </p>
            </div>

            {/* Plantilla type - italic */}
            {plantillaType && (
              <div className="mt-3 italic">
                <span className="underline underline-offset-1">
                  Plantilla: {plantillaType}
                </span>
              </div>
            )}

            {/* Reversion clause - for Promotion only */}
            {isPromotion && (
              <div className="mt-2 text-[12px] italic">
                *the appointee shall be reverted to his/her former position in
                case the promotional appointment of the previous position holder
                is disapproved or invalidated.
              </div>
            )}

            {/* Signatory section - right aligned */}
            <div className="mt-10 flex justify-between items-end">
              <div className="text-[12px]">
                <div>Accredited/Deregulated Pursuant to</div>
                <div className="underline underline-offset-1">
                  CSC Resolution No. 2100140, s. 2021
                </div>
                <div>
                  dated{" "}
                  <span className="underline underline-offset-1">
                    February 16, 2021
                  </span>
                </div>
                <div className="mt-6 text-slate-400 font-medium">DRY SEAL</div>
              </div>
              <div className="text-right">
                <div className="mb-4">Very truly yours,</div>
                {sdsUser?.signature_path && (
                  <div className="mb-1">
                    <img
                      src={sdsUser.signature_path}
                      alt=""
                      width={80}
                      height={50}
                      className="object-contain ml-auto mr-0"
                    />
                  </div>
                )}
                <div className="font-bold border-b-2 border-black pb-1">
                  {sdsName ?? "________________"}
                </div>
                <div className="text-[12px] mt-1">
                  OIC-Schools Division Superintendent
                </div>
                <div className="text-[12px]">Appointing Officer/Authority</div>
                <div className="text-[12px] mt-3 font-bold">
                  {effectiveDate}
                </div>
                <div className="text-[12px]">Date of Signing</div>
                <div className="mt-8 text-[10px] text-slate-500">
                  (Stamp of Date of Release)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PAGE 2 ==================== */}
        <div className="mt-8 print:break-before-page">
          {/* Certification 1 */}
          <div className="border-2 border-black p-4 mb-1 bg-gray-200">
            <div className="border-2 border-black p-4 mb-4 bg-white">
              <div className="text-center font-bold mb-3">Certification</div>
              <div className="text-justify leading-relaxed text-[13px] space-y-2">
                <p className="indent-8">
                  This is to certify that all requirements and supporting papers
                  pursuant to CSC MC No. 24, s. 2017,{" "}
                  <strong>as amended</strong>, have been complied with, reviewed
                  and found to be in order.
                </p>
                <p className="indent-8">
                  The position was published at{" "}
                  <span className="underline">________________</span> from{" "}
                  <span className="underline">________________</span> to{" "}
                  <span className="underline">________________</span> and posted
                  in <span className="underline">________________</span> from{" "}
                  <span className="underline">________________</span> to{" "}
                  <span className="underline">________________</span> in
                  consonance with RA No. 7041. The assessment by the Human
                  Resource Merit Promotion and Selection Board (HRMPSB) started
                  on <span className="underline">________________</span>.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-right min-w-[200px]">
                  <div className="font-bold border-b-2 border-black pb-1">
                    JASMINE B. NEPA
                  </div>
                  <div className="text-[12px]">
                    Administrative Officer IV - HRMO
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certification 2 */}

          <div className="border-2 border-black p-4 mb-1 bg-gray-200">
            <div className="border-2 border-black p-4 mb-4 bg-white">
              <div className="text-center font-bold mb-3">Certification</div>
              <div className="text-justify leading-relaxed text-[13px]">
                <p className="indent-8">
                  This is to certify that the appointee has been screened and
                  found qualified by the majority of the HRMPSB during the
                  deliberation held on{" "}
                  <span className="underline">________________</span>.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-right min-w-[200px]">
                  <div className="font-bold border-b-2 border-black pb-1">
                    CORAZON P. ROA
                  </div>
                  <div className="text-[12px]">
                    Assistant Schools Division Superintendent
                  </div>
                  <div className="text-[12px]">Chairperson, HRMPSB</div>
                </div>
              </div>
            </div>
          </div>

          {/* CSC/HRMO Notation */}
          <div className="border-2 border-black p-4 mb-1 bg-gray-200">
            <div className="border-2 border-black p-4 mb-4 bg-white">
              <div className="text-center font-bold mb-3">
                CSC/HRMO Notation
              </div>
              <table className="w-full text-[12px] border-collapse">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold">
                      <div className="text-center">ACTION ON APPOINTMENTS</div>
                    </td>
                    <td className="border border-black p-2 w-32 font-bold text-center">
                      Recorded by
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        Validated per RAI for the month of{" "}
                        <span className="underline flex-1">
                          _______________
                        </span>
                      </div>
                    </td>
                    <td className="border border-black p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        Invalidated per CSCRO/FO letter dated{" "}
                        <span className="underline flex-1">
                          _______________
                        </span>
                      </div>
                    </td>
                    <td className="border border-black p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        Appeal
                      </div>
                    </td>
                    <td className="border border-black p-2">
                      <div className="grid grid-cols-2 gap-2 text-center font-bold">
                        <span>DATE FILED</span>
                        <span>STATUS</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 pl-8">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        CSCRO/CSC-Commission
                      </div>
                    </td>
                    <td className="border border-black p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border-b border-black min-h-[20px]"></div>
                        <div className="border-b border-black min-h-[20px]"></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        Petition for Review
                      </div>
                    </td>
                    <td className="border border-black p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 pl-8">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        CSC-Commission
                      </div>
                    </td>
                    <td className="border border-black p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border-b border-black min-h-[20px]"></div>
                        <div className="border-b border-black min-h-[20px]"></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 pl-8">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        Court of Appeals
                      </div>
                    </td>
                    <td className="border border-black p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border-b border-black min-h-[20px]"></div>
                        <div className="border-b border-black min-h-[20px]"></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 pl-8">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black" />
                        Supreme Court
                      </div>
                    </td>
                    <td className="border border-black p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border-b border-black min-h-[20px]"></div>
                        <div className="border-b border-black min-h-[20px]"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Acknowledgement */}
          <div className="border-2 border-black p-4 mb-1 bg-gray-200">
            <div className="border-2 border-black p-4 mb-4 bg-white">
              <div className="text-center font-bold mb-3">Acknowledgement</div>
              <div className="flex gap-8">
                <div className="flex-1 text-[13px] space-y-1">
                  <div>Original Copy - for the Appointee</div>
                  <div>Original Copy - for the Civil Service Commission</div>
                  <div>Original Copy - for the Agency</div>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] mb-4">
                    Received original/photocopy of appointment on{" "}
                    <span className="underline">________________</span>
                  </div>
                  <div className="font-bold border-b-2 border-black pb-1">
                    {fullName}
                  </div>
                  <div className="text-[12px]">Appointee</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
