/* eslint-disable @next/next/no-img-element */
import { useSupabase } from "@/context/SupabaseProvider";
import { ApplicantTypes } from "@/types";
import { format } from "date-fns";
import * as React from "react";

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes;
}

/**
 * CS Form No. 4 (Revised 2018): Certification of Assumption to Duty
 * Matches the exact CSC official format. Sized for folio bond paper (8.5in x 13in).
 */
export const PrintAssumption = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props;
  const { systemAccess, systemUsers } = useSupabase();

  if (!selectedItem?.date) {
    return null;
  }

  const hrmoAccess = systemAccess?.find(
    (a: { type: string }) => a.type === "hrmo",
  );
  const hrmoUser = systemUsers?.find(
    (u: { id: string }) => u.id === hrmoAccess?.user_id,
  );
  const hrmoName = hrmoUser
    ? `${hrmoUser.firstname} ${hrmoUser.middlename ?? ""} ${hrmoUser.lastname}`.trim()
    : "";

  const targetDate = new Date(selectedItem.date);
  const dayOfMonth = format(targetDate, "d");
  const monthName = format(targetDate, "MMMM");
  const year = format(targetDate, "yyyy");
  const effectiveDate = format(targetDate, "MMMM d, yyyy");

  const honorific =
    selectedItem?.sex === "Female"
      ? "Ms."
      : selectedItem?.sex === "Male"
        ? "Mr."
        : "Ms./Mr.";
  const fullName =
    `${selectedItem.firstname} ${selectedItem.middlename ?? ""} ${selectedItem.lastname}`.trim();
  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    "";
  const assignment =
    selectedItem?.assignment || "Schools Division Office of Bayugan City";
  const signatory = selectedItem?.signatory || "";
  const signatoryPosition =
    selectedItem?.position || "Head of Office/Department/Unit";
  const attestedBy = selectedItem?.attested_by || hrmoName || "";
  const attestedByPosition =
    selectedItem?.attested_by_position || "HRMO";
  const signingDate = selectedItem?.date
    ? format(new Date(selectedItem.date), "MMMM d, yyyy")
    : "";

  // Underline blank
  const uline = (value: string, minW = "150px") => (
    <span
      style={{
        display: "inline-block",
        minWidth: minW,
        borderBottom: "1px solid black",
        textAlign: "center",
        fontWeight: value ? "bold" : "normal",
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
          fontSize: "14px",
          width: "100%",
          height: "11in",
          display: "flex",
          flexDirection: "column",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        } as React.CSSProperties}
      >
        {/* CS Form number */}
        <div style={{ fontSize: "12px", lineHeight: "1.4", fontStyle: "italic" }}>
          <div style={{ fontWeight: "bold" }}>CS Form No. 4</div>
          <div>Revised 2018</div>
        </div>

        {/* Republic header */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <img
            src="/logos/deped.png"
            alt="DepEd Seal"
            width={80}
            height={80}
            style={{ display: "inline-block", objectFit: "contain", marginBottom: "6px" }}
          />
          <div
            style={{
              fontWeight: "bold",
              fontSize: "16px",
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
              fontSize: "14px",
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
              fontSize: "14px",
            }}
          >
            SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "18px",
            marginTop: "50px",
            marginBottom: "40px",
          }}
        >
          CERTIFICATION OF ASSUMPTION TO DUTY
        </div>

        {/* Body text — justified with blanks */}
        <div
          style={{
            textAlign: "justify",
            lineHeight: "2.4",
            fontSize: "14px",
            padding: "0 20px",
          }}
        >
          {/* Paragraph 1 */}
          <p style={{ textIndent: "2em", marginBottom: "16px" }}>
            This is to certify that {honorific}{" "}
            {uline(fullName, "220px")} has assumed the duties and
            responsibilities as {uline(positionName, "170px")} of{" "}
            {uline(assignment, "200px")}, effective{" "}
            {uline(effectiveDate, "130px")}.
          </p>

          {/* Paragraph 2 */}
          <p style={{ textIndent: "2em", marginBottom: "16px" }}>
            This certification is issued in connection with the issuance of the
            appointment of {honorific}{" "}
            {uline(fullName, "220px")} as{" "}
            {uline(positionName, "170px")}.
          </p>

          {/* Paragraph 3 */}
          <p style={{ textIndent: "2em" }}>
            Done this {uline(dayOfMonth, "30px")} day of{" "}
            {uline(monthName, "80px")} {uline(year, "50px")} in{" "}
            {uline("Bayugan City", "120px")}.
          </p>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Signatory — Head of Office (right aligned) */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "0 20px",
            marginBottom: "8px",
          }}
        >
          <div style={{ textAlign: "center", minWidth: "220px" }}>
            <div
              style={{
                borderBottom: "1px solid black",
                paddingBottom: "2px",
                fontWeight: "bold",
              }}
            >
              {signatory || "\u00A0"}
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>
              {signatoryPosition}
            </div>
          </div>
        </div>

        {/* Date */}
        <div style={{ padding: "0 20px", marginBottom: "30px", fontSize: "14px" }}>
          Date: {uline(signingDate, "130px")}
        </div>

        {/* Attested by */}
        <div
          style={{
            padding: "0 20px",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: "bold" }}>Attested by:</div>
        </div>

        {/* HRMO signature (left aligned) */}
        <div style={{ padding: "0 20px", marginBottom: "40px" }}>
          <div style={{ minWidth: "220px", display: "inline-block" }}>
            <div
              style={{
                borderBottom: "1px solid black",
                paddingBottom: "2px",
                fontWeight: "bold",
                minWidth: "200px",
              }}
            >
              {attestedBy || "\u00A0"}
            </div>
            <div
              style={{
                fontSize: "13px",
                marginTop: "2px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {attestedByPosition}
            </div>
          </div>
        </div>

        {/* Distribution + CSC submission note */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 20px",
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          <div style={{ lineHeight: "1.6" }}>
            <div>201 file</div>
            <div>Admin</div>
            <div>COA</div>
            <div>CSC</div>
          </div>
          <div
            style={{
              border: "1px solid black",
              padding: "8px 14px",
              textAlign: "center",
              lineHeight: "1.6",
              fontStyle: "italic",
            }}
          >
            <div>
              <strong>For submission to CSC FO</strong>
            </div>
            <div>within 30 days from the</div>
            <div>date of assumption of the</div>
            <div>appointee</div>
          </div>
        </div>
      </div>
    </div>
  );
});
