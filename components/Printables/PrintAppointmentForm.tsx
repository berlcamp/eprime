/* eslint-disable @next/next/no-img-element */
import { useSupabase } from "@/context/SupabaseProvider";
import { ApplicantTypes } from "@/types";
import { format } from "date-fns";
import * as React from "react";

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes;
}

// Folio bond paper: 8.5in x 13in
// @page margin: 0.4in → printable height ≈ 12.2in
// Using fixed height so flex children can expand to fill the page
const PAGE_W = "100%";
const PAGE_H = "12.2in";
const GRAY_BG = "#d0d0d0";
const GRAY_PAD = "10px"; // gray gap between outer border and white box

// Reusable checkbox square
const Checkbox = () => (
  <span
    style={{
      display: "inline-block",
      width: "11px",
      height: "11px",
      border: "1.5px solid black",
      marginRight: "5px",
      verticalAlign: "middle",
    }}
  />
);

/**
 * CS Form No. 33-B (Revised 2018): Appointment Form - For Accredited/Deregulated Agencies
 * Sized for folio bond paper (8.5in x 13in).
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
    : "";

  const hrmoAccess = systemAccess?.find(
    (a: { type: string }) => a.type === "hr",
  );
  const hrmoUser = systemUsers?.find(
    (u: { id: string }) => u.id === hrmoAccess?.user_id,
  );
  const hrmoName = hrmoUser
    ? `${hrmoUser.firstname} ${hrmoUser.middlename ?? ""} ${hrmoUser.lastname}`.trim()
    : "";
  const hrmoTitle = hrmoAccess?.title || "HRMO";

  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    "";
  const salaryGrade =
    selectedItem?.ranking?.position?.salary_grade ||
    selectedItem?.hrm_item?.salary_grade ||
    selectedItem?.hrm_item?.hrm_position?.salary_grade ||
    "______";
  const fullName = `${selectedItem.firstname} ${selectedItem.middlename ?? ""} ${selectedItem.lastname}`.trim();
  const assignment =
    selectedItem?.assignment || "Schools Division Office of Bayugan City";
  const employmentStatus = (
    selectedItem?.employment_status || "Permanent"
  ).toUpperCase();
  const natureOfAppointment = (
    selectedItem?.nature_of_appointment || "Original"
  ).toUpperCase();
  const vice = selectedItem?.vice ?? "";
  const reasonOfVacancy = (
    selectedItem?.reason_of_vacancy ?? ""
  ).toUpperCase();
  const plantillaNumber = selectedItem?.plantilla_number ?? "";
  const salaryAmount = selectedItem?.salary_amount ?? "";
  const salaryInWords = (
    selectedItem?.salary_in_words ?? ""
  ).toUpperCase();
  const effectiveDate = selectedItem?.date
    ? format(new Date(selectedItem.date), "MMMM d, yyyy")
    : "";

  const formatDateOrBlank = (val?: string) =>
    val && !Number.isNaN(new Date(val).getTime())
      ? format(new Date(val), "MMMM d, yyyy")
      : "________________";

  const ext = selectedItem as ApplicantTypes & {
    published_at?: string;
    published_from?: string;
    published_to?: string;
    posted_in?: string;
    posted_from?: string;
    posted_to?: string;
    hrmpsb_assessment_started_on?: string;
    hrmpsb_chair_name?: string;
    acknowledgement_date?: string;
  };
  const hrmpsbName = ext?.hrmpsb_chair_name ?? "";
  const acknowledgementDate = formatDateOrBlank(ext?.acknowledgement_date);
  const publishedAt = ext?.published_at ?? "________________";
  const publishedFrom = formatDateOrBlank(ext?.published_from);
  const publishedTo = formatDateOrBlank(ext?.published_to);
  const postedIn = ext?.posted_in ?? "________________";
  const postedFrom = formatDateOrBlank(ext?.posted_from);
  const postedTo = formatDateOrBlank(ext?.posted_to);
  const hrmpsbAssessmentStarted = formatDateOrBlank(
    ext?.hrmpsb_assessment_started_on,
  );

  const salutation =
    selectedItem?.sex?.toLowerCase() === "male"
      ? "Mr."
      : selectedItem?.sex?.toLowerCase() === "female"
        ? "Ms."
        : "Mr./Mrs./Ms.";

  // Underline blank
  const uline = (
    value: string,
    minW = "150px",
    bold = true,
  ) => (
    <span
      style={{
        display: "inline-block",
        minWidth: minW,
        borderBottom: "1px solid black",
        textAlign: "center",
        fontWeight: bold && value ? "bold" : "normal",
      }}
    >
      {value || "\u00A0"}
    </span>
  );

  return (
    <div className="invisible">
      <div
        ref={ref}
        style={{
          fontFamily: "Times New Roman, serif",
          fontSize: "12px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        } as React.CSSProperties}
      >
        {/* ==================== PAGE 1 ==================== */}
        <div
          style={{
            width: PAGE_W,
            height: PAGE_H,
            display: "flex",
            flexDirection: "column",
            pageBreakAfter: "always",
          }}
        >
          {/* Top right label — sits above the gray area */}
          <div style={{ textAlign: "right", marginBottom: "3px" }}>
            <span
              style={{
                display: "inline-block",
                border: "1px solid black",
                padding: "2px 10px",
                fontSize: "10px",
                fontStyle: "italic",
              }}
            >
              For Accredited/Deregulated Agencies
            </span>
          </div>

          {/* Gray outer area fills the rest of the page */}
          <div
            style={{
              flex: 1,
              border: "2px solid black",
              backgroundColor: GRAY_BG,
              padding: GRAY_PAD,
              boxSizing: "border-box",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties}
          >
            {/* Single white content box */}
            <div
              style={{
                border: "2px solid black",
                backgroundColor: "white",
                padding: "18px 26px",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* CS Form number + Stamp */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
                  <div style={{ fontWeight: "bold" }}>CS Form No. 33-B</div>
                  <div style={{ fontStyle: "italic" }}>Revised 2018</div>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  (Stamp of Date of Receipt)
                </div>
              </div>

              {/* Republic header */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "2px",
                  }}
                >
                  Republic of the Philippines
                </div>
                <div
                  style={{
                    borderBottom: "1px solid black",
                    display: "inline-block",
                    padding: "0 20px",
                    fontSize: "12px",
                    marginBottom: "2px",
                  }}
                >
                  DEPARTMENT OF EDUCATION
                </div>
                <br />
                <div
                  style={{
                    borderBottom: "1px solid black",
                    display: "inline-block",
                    padding: "0 20px",
                    fontSize: "12px",
                  }}
                >
                  SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
                </div>
              </div>

              {/* Addressee */}
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontWeight: "bold" }}>{salutation}:</span>{" "}
                {uline(fullName, "250px")}
              </div>

              {/* Form fields */}
              <div style={{ lineHeight: "2.2", fontSize: "12px" }}>
                {/* You are hereby appointed as ___ (SG/JG/PG ___) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap", marginRight: "4px" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;You are hereby appointed
                    as{" "}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {positionName || "\u00A0"}
                  </span>
                  <span style={{ whiteSpace: "nowrap", marginLeft: "8px" }}>
                    (SG/JG/PG{" "}
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: "40px",
                        borderBottom: "1px solid black",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {salaryGrade}
                    </span>
                    )
                  </span>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "9px",
                    fontStyle: "italic",
                    marginTop: "-6px",
                    marginBottom: "2px",
                  }}
                >
                  (Position Title)
                </div>

                {/* under ___ status at the ___ */}
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "bold", marginRight: "4px" }}>
                    under{" "}
                  </span>
                  <span
                    style={{
                      minWidth: "160px",
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {employmentStatus || "\u00A0"}
                  </span>
                  <span
                    style={{ whiteSpace: "nowrap", margin: "0 4px" }}
                  >
                    {" "}
                    status at the{" "}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {assignment.toUpperCase() || "\u00A0"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "9px",
                    fontStyle: "italic",
                    marginTop: "-6px",
                    marginBottom: "2px",
                  }}
                >
                  <span style={{ marginLeft: "40px" }}>
                    (Permanent, Temporary, etc.)
                  </span>
                  <span style={{ marginRight: "60px" }}>
                    (Office/Department/Unit)
                  </span>
                </div>

                {/* with a compensation rate of ___ (P___) */}
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ whiteSpace: "nowrap", marginRight: "4px" }}>
                    with a compensation rate of{" "}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {salaryInWords || "\u00A0"}
                  </span>
                  <span style={{ whiteSpace: "nowrap", marginLeft: "4px" }}>
                    (P
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: "100px",
                        borderBottom: "1px solid black",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {salaryAmount || "\u00A0"}
                    </span>
                    )
                  </span>
                </div>
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>pesos per month.</strong>
                </div>

                {/* The nature of this appointment is ___ vice ___ */}
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ whiteSpace: "nowrap", marginRight: "4px" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The nature of this
                    appointment is{" "}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {natureOfAppointment || "\u00A0"}
                  </span>
                  <span style={{ whiteSpace: "nowrap", margin: "0 4px" }}>
                    {" "}
                    vice{" "}
                  </span>
                  <span
                    style={{
                      minWidth: "120px",
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {vice || "\u00A0"}
                  </span>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "9px",
                    fontStyle: "italic",
                    marginTop: "-6px",
                    marginBottom: "2px",
                    marginRight: "120px",
                  }}
                >
                  (Original, Promotion, etc.)
                </div>

                {/* ___, who ___ with Plantilla Item No. ___ */}
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span
                    style={{
                      minWidth: "180px",
                      borderBottom: "1px solid black",
                      textAlign: "center",
                    }}
                  >
                    {"\u00A0"}
                  </span>
                  <span style={{ whiteSpace: "nowrap", margin: "0 4px" }}>
                    , who
                  </span>
                  <span
                    style={{
                      minWidth: "130px",
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {reasonOfVacancy || "\u00A0"}
                  </span>
                  <span style={{ whiteSpace: "nowrap", margin: "0 4px" }}>
                    {" "}
                    with Plantilla Item No.
                  </span>
                  <span
                    style={{
                      minWidth: "100px",
                      borderBottom: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {plantillaNumber || "\u00A0"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    fontStyle: "italic",
                    marginTop: "-6px",
                    marginBottom: "2px",
                    marginLeft: "200px",
                  }}
                >
                  (Transferred, Retired, etc.)
                </div>

                {/* Page ___. */}
                <div>
                  Page
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: "50px",
                      borderBottom: "1px solid black",
                    }}
                  >
                    &nbsp;
                  </span>
                  .
                </div>
              </div>

              {/* Effective date clause */}
              <div
                style={{
                  marginTop: "20px",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                <p style={{ textIndent: "2em", textAlign: "justify" }}>
                  This appointment shall take effect on the date of signing by
                  the appointing officer/authority.
                </p>
              </div>

              {/* Spacer pushes signature down */}
              <div style={{ flex: 1 }} />

              {/* Very truly yours */}
              <div style={{ textAlign: "right", marginBottom: "6px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "28px" }}>
                  Very truly yours,
                </div>
                {sdsUser?.signature_path && (
                  <div style={{ marginBottom: "2px" }}>
                    <img
                      src={sdsUser.signature_path}
                      alt=""
                      width={80}
                      height={50}
                      style={{
                        objectFit: "contain",
                        marginLeft: "auto",
                        display: "block",
                      }}
                    />
                  </div>
                )}
                <div
                  style={{
                    display: "inline-block",
                    borderBottom: "2px solid black",
                    paddingBottom: "2px",
                    minWidth: "220px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {sdsName || "\u00A0"}
                </div>
                <div style={{ fontSize: "11px", marginTop: "2px" }}>
                  Appointing Officer/Authority
                </div>
              </div>

              {/* Date of signing */}
              <div
                style={{
                  textAlign: "right",
                  marginTop: "16px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    borderBottom: "1px solid black",
                    paddingBottom: "2px",
                    minWidth: "220px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {effectiveDate || "\u00A0"}
                </div>
                <div style={{ fontSize: "11px", marginTop: "2px" }}>
                  Date of Signing
                </div>
              </div>

              {/* Bottom: Accreditation left, Stamp right */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: "auto",
                }}
              >
                <div style={{ fontSize: "11px", lineHeight: "1.5" }}>
                  <div style={{ fontWeight: "bold" }}>
                    Accredited/Deregulated Pursuant to
                  </div>
                  <div>
                    CSC Resolution No.{" "}
                    {uline("2100140", "60px", false)}, s.{" "}
                    {uline("2021", "40px", false)}
                  </div>
                  <div>
                    dated {uline("February 16, 2021", "120px", false)}
                  </div>
                  <div
                    style={{
                      marginTop: "16px",
                      fontStyle: "italic",
                      fontWeight: "bold",
                      color: "#999",
                      fontSize: "13px",
                    }}
                  >
                    DRY SEAL
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  (Stamp of Date of Release)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PAGE 2 ==================== */}
        <div
          style={{
            width: PAGE_W,
            height: PAGE_H,
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            pageBreakBefore: "always",
          }}
        >
          {/* ---- Gray Box 1: Both Certifications grouped ---- */}
          <div
            style={{
              flex: 5,
              border: "2px solid black",
              backgroundColor: GRAY_BG,
              padding: GRAY_PAD,
              display: "flex",
              flexDirection: "column",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties}
          >
            {/* Certification 1 — HRMO */}
            <div
              style={{
                flex: 1,
                border: "2px solid black",
                backgroundColor: "white",
                padding: "14px 22px",
                marginBottom: GRAY_PAD,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "13px",
                  marginBottom: "8px",
                  textDecoration: "underline",
                }}
              >
                Certification
              </div>
              <div
                style={{
                  textAlign: "justify",
                  lineHeight: "1.8",
                  fontSize: "12px",
                }}
              >
                <p style={{ textIndent: "2em", marginBottom: "6px" }}>
                  This is to certify that all requirements and supporting papers
                  pursuant to{" "}
                  <strong>CSC MC No. 24, s. 2017, as amended,</strong> have been
                  complied with, reviewed and found to be in order.
                </p>
                <p style={{ textIndent: "2em" }}>
                  The position was published at{" "}
                  {uline(publishedAt, "170px")} from{" "}
                  {uline(publishedFrom, "75px")} to{" "}
                  {uline(publishedTo, "75px")} and posted in{" "}
                  {uline(postedIn, "190px")} from{" "}
                  {uline(postedFrom, "75px")} to{" "}
                  {uline(postedTo, "75px")} in consonance with RA No. 7041. The
                  assessment by the Human Resource Merit Promotion and Selection
                  Board (HRMPSB) started on{" "}
                  {uline(hrmpsbAssessmentStarted, "110px")}.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "16px",
                }}
              >
                <div style={{ textAlign: "center", minWidth: "200px" }}>
                  <div
                    style={{
                      borderBottom: "2px solid black",
                      paddingBottom: "2px",
                      fontWeight: "bold",
                    }}
                  >
                    {hrmoName || "\u00A0"}
                  </div>
                  <div style={{ fontSize: "11px", marginTop: "2px" }}>
                    {hrmoTitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Certification 2 — HRMPSB/Placement Committee */}
            <div
              style={{
                flex: 1,
                border: "2px solid black",
                backgroundColor: "white",
                padding: "14px 22px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "13px",
                  marginBottom: "8px",
                  textDecoration: "underline",
                }}
              >
                Certification
              </div>
              <div
                style={{
                  textAlign: "justify",
                  lineHeight: "1.8",
                  fontSize: "12px",
                }}
              >
                <p style={{ textIndent: "2em" }}>
                  This is to certify that the appointee has been screened and
                  found qualified by the majority of the HRMPSB/
                  <strong>Placement Committee</strong> during the deliberation
                  held on{" "}
                  <span
                    style={{
                      borderBottom: "1px solid black",
                      display: "inline-block",
                      minWidth: "120px",
                    }}
                  >
                    &nbsp;
                  </span>
                  .
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "16px",
                }}
              >
                <div style={{ textAlign: "center", minWidth: "260px" }}>
                  <div
                    style={{
                      borderBottom: "2px solid black",
                      paddingBottom: "2px",
                      fontWeight: "bold",
                    }}
                  >
                    {hrmpsbName || "\u00A0"}
                  </div>
                  <div style={{ fontSize: "11px", marginTop: "2px" }}>
                    Chairperson, HRMPSB/<strong>Placement Committee</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Gray Box 2: CSC/HRMO Notation ---- */}
          <div
            style={{
              flex: 4,
              border: "2px solid black",
              backgroundColor: GRAY_BG,
              padding: GRAY_PAD,
              display: "flex",
              flexDirection: "column",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties}
          >
            <div
              style={{
                flex: 1,
                border: "2px solid black",
                backgroundColor: "white",
                padding: "8px 14px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                CSC/HRMO Notation
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      ACTION ON APPOINTMENTS
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "90px",
                      }}
                    >
                      Recorded by
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      <Checkbox />
                      <strong>Validated</strong> per RAI for the month of{" "}
                      <span
                        style={{
                          borderBottom: "1px solid black",
                          display: "inline-block",
                          minWidth: "190px",
                        }}
                      >
                        &nbsp;
                      </span>
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      <Checkbox />
                      <strong>Invalidated</strong> per CSCRO/FO letter dated{" "}
                      <span
                        style={{
                          borderBottom: "1px solid black",
                          display: "inline-block",
                          minWidth: "170px",
                        }}
                      >
                        &nbsp;
                      </span>
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                  <tr>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      <Checkbox />
                      <strong>Appeal</strong>
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                      }}
                    >
                      DATE FILED
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                      }}
                    >
                      STATUS
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        paddingLeft: "26px",
                      }}
                    >
                      <Checkbox />
                      CSCRO/ CSC-Commission
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                  <tr>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      <Checkbox />
                      <strong>Petition for Review</strong>
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        paddingLeft: "26px",
                      }}
                    >
                      <Checkbox />
                      CSC-Commission
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        paddingLeft: "26px",
                      }}
                    >
                      <Checkbox />
                      Court of Appeals
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        paddingLeft: "26px",
                      }}
                    >
                      <Checkbox />
                      Supreme Court
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ---- Gray Box 3: Acknowledgement + Original Copy ---- */}
          <div
            style={{
              flex: 1.5,
              border: "2px solid black",
              backgroundColor: GRAY_BG,
              padding: GRAY_PAD,
              display: "flex",
              flexDirection: "column",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties}
          >
            <div
              style={{
                flex: 1,
                border: "2px solid black",
                backgroundColor: "white",
                display: "flex",
              }}
            >
              {/* Left: Original Copy info */}
              <div
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  fontSize: "11px",
                  lineHeight: "1.8",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div>Original Copy &nbsp;- &nbsp;for the Appointee</div>
                <div>
                  Original Copy &nbsp;- &nbsp;for the Civil Service Commission
                </div>
                <div>Original Copy &nbsp;- &nbsp;for the Agency</div>
              </div>
              {/* Right: Acknowledgement */}
              <div
                style={{
                  flex: 1,
                  borderLeft: "1px solid black",
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  Acknowledgement
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontStyle: "italic",
                    marginBottom: "14px",
                  }}
                >
                  Received original/photocopy of appointment on{" "}
                  <span
                    style={{
                      borderBottom: "1px solid black",
                      display: "inline-block",
                      minWidth: "140px",
                      textAlign: "center",
                      fontStyle: "normal",
                      fontWeight:
                        acknowledgementDate &&
                        acknowledgementDate !== "________________"
                          ? "bold"
                          : "normal",
                    }}
                  >
                    {acknowledgementDate &&
                    acknowledgementDate !== "________________"
                      ? acknowledgementDate
                      : " "}
                  </span>
                </div>
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <div
                    style={{
                      borderBottom: "1px solid black",
                      display: "inline-block",
                      minWidth: "200px",
                      fontWeight: "bold",
                    }}
                  >
                    {fullName}
                  </div>
                  <div style={{ fontSize: "11px", marginTop: "2px" }}>
                    Appointee
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
