/* eslint-disable @next/next/no-img-element */
import { useSupabase } from "@/context/SupabaseProvider";
import { ApplicantTypes } from "@/types";
import { format } from "date-fns";
import * as React from "react";
import { PrintFooter } from "./PrintFooter";

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes;
}

/**
 * CS Form No. 32 (Narebisa / Revised 2025): Panunumpa sa Katungkulan — Oath of Office.
 * Body of the oath is rendered as a pre-rendered bilingual image; we overlay
 * the Name / Address / Position values on top of the image's blank underlines.
 */
export const PrintOathOfOffice = React.forwardRef<
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
    ? `${sdsUser.firstname} ${sdsUser.middlename ?? ""} ${sdsUser.lastname}`.trim().toUpperCase()
    : "";
  const sdsSignature = process.env.NEXT_PUBLIC_SDS_SIGNATURE ?? "";

  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    "";
  const fullName =
    `${selectedItem.firstname ?? ""} ${selectedItem.middlename ?? ""} ${selectedItem.lastname ?? ""}`.trim();
  const address = selectedItem?.address || "";

  const oathDate = selectedItem?.date ? new Date(selectedItem.date) : null;
  const oathDay = oathDate ? format(oathDate, "d") : "";
  const oathMonth = oathDate ? format(oathDate, "MMMM") : "";
  const oathYearSuffix = oathDate ? format(oathDate, "yy") : "";

  const blank = (value: string, width: string) => (
    <span
      style={{
        display: "inline-block",
        width,
        borderBottom: "1px solid black",
        textAlign: "center",
        fontWeight: value ? "bold" : "normal",
        lineHeight: 1.2,
        verticalAlign: "bottom",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {value || " "}
    </span>
  );

  // Overlay for the 3 blanks on the oath_content.png image.
  // Coordinates are % of image bounding box; tuned for the official CSC
  // bilingual layout.
  const overlay = (
    value: string,
    top: string,
    left: string,
    width: string,
  ) => (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "16px",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {value}
    </div>
  );

  return (
    <div
      className="fixed left-[-9999px] top-0 w-[816px] print:left-0 print:relative print:m-0"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <style>{`
        @media print {
          @page { margin: 0.6in 0.7in !important; }
        }
      `}</style>
      <div
        ref={ref}
        className="w-[816px] bg-white px-10 py-6 print:p-0 print:m-0 print:pb-36"
        style={{
          fontFamily: "Times New Roman, serif",
          fontSize: "15px",
          color: "black",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Top-left form reference (absolute so center header flows from top) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              fontSize: "13px",
              lineHeight: 1.25,
            }}
          >
            <div style={{ fontWeight: "bold" }}>SS Porma Blg. 32</div>
            <div style={{ fontStyle: "italic" }}>CS Form No. 32</div>
            <div style={{ height: "10px" }} />
            <div style={{ fontWeight: "bold" }}>Narebisa 2025</div>
            <div style={{ fontStyle: "italic" }}>Revised 2025</div>
          </div>

          {/* Centered republic / department header */}
          <div style={{ textAlign: "center" }}>
            <img
              src="/logos/deped.png"
              alt="DepEd Seal"
              width={80}
              height={80}
              style={{ display: "inline-block", objectFit: "contain", marginBottom: "6px" }}
            />
            <div style={{ fontSize: "16px" }}>REPUBLIKA NG PILIPINAS</div>
            <div style={{ fontSize: "14px", fontStyle: "italic" }}>
              REPUBLIC OF THE PHILIPPINES
            </div>
            <div style={{ height: "10px" }} />
            <div
              style={{
                fontWeight: "bold",
                textDecoration: "underline",
                fontSize: "15px",
              }}
            >
              KAGAWARAN NG EDUKASYON
            </div>
            <div
              style={{
                fontWeight: "bold",
                textDecoration: "underline",
                fontSize: "15px",
              }}
            >
              SANGAY NG MGA PAARALAN NG LUNGSOD NG BAYUGAN
            </div>
            <div
              style={{
                fontStyle: "italic",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              DEPARTMENT OF EDUCATION
            </div>
            <div
              style={{
                fontStyle: "italic",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <div style={{ fontWeight: "bold", fontSize: "26px" }}>
            PANUNUMPA SA KATUNGKULAN
          </div>
          <div
            style={{
              fontStyle: "italic",
              fontSize: "14px",
              marginTop: "2px",
            }}
          >
            OATH OF OFFICE
          </div>
        </div>

        {/* Body: bilingual oath rendered as image with value overlays on the blanks */}
        <div
          style={{
            marginTop: "28px",
            position: "relative",
            width: "100%",
            paddingLeft: "20px",
            paddingRight: "20px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            <img
              src="/images/oath_content.png"
              alt="Oath of Office bilingual body"
              style={{ width: "100%", display: "block" }}
            />
            {/* Row 1: Name of Appointee */}
            {overlay(fullName, "1%", "10%", "37%")}
            {/* Row 1: Address */}
            {overlay(address, "1%", "50%", "36%")}
            {/* Row 3: Position */}
            {overlay(positionName, "17%", "16%", "31%")}
          </div>
        </div>

        {/* Appointee signature */}
        <div
          style={{
            marginTop: "48px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                borderBottom: "1px solid black",
                minWidth: "260px",
                height: "18px",
              }}
            />
            <div style={{ fontStyle: "italic", fontSize: "13px" }}>
              (Lagda sa itaas ng pangalan ng hinirang)
            </div>
          </div>
        </div>

        {/* Government ID block */}
        <div style={{ marginTop: "20px", fontSize: "14px" }}>
          <div style={{ fontStyle: "italic" }}>
            Government ID:{" "}
            <span
              style={{
                display: "inline-block",
                minWidth: "180px",
                borderBottom: "1px solid black",
              }}
            />
          </div>
          <div>
            Numero ng <em>ID</em>:{" "}
            <span
              style={{
                display: "inline-block",
                minWidth: "180px",
                borderBottom: "1px solid black",
              }}
            />
          </div>
          <div>
            Araw ng Pagkakaloob:{" "}
            <span
              style={{
                display: "inline-block",
                minWidth: "180px",
                borderBottom: "1px solid black",
              }}
            />
          </div>
        </div>

        <hr style={{ borderTop: "2px solid black", marginTop: "18px" }} />

        {/* Nilagdaan */}
        <div
          style={{
            marginTop: "14px",
            fontSize: "15px",
            textIndent: "48px",
            lineHeight: 1.8,
          }}
        >
          Nilagdaan at pinanumpaan sa harap ko ngayong ika{" "}
          {blank(oathDay, "40px")} ng {blank(oathMonth, "110px")}, 20
          {blank(oathYearSuffix, "40px")} sa{" "}
          {blank("", "180px")}, Pilipinas.
        </div>

        {/* Schools Division Superintendent */}
        <div
          style={{
            marginTop: "60px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ textAlign: "center", minWidth: "280px" }}>
            <div style={{ height: "60px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              {sdsSignature && (
                <img
                  src={sdsSignature}
                  alt="SDS Signature"
                  style={{ maxHeight: "60px", maxWidth: "220px", objectFit: "contain" }}
                />
              )}
            </div>
            <div style={{ borderBottom: "1px solid black" }} />
            <div style={{ fontWeight: "bold", fontSize: "15px", marginTop: "4px" }}>
              {sdsName || " "}
            </div>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>
              Pansangay na Tagapamahala
            </div>
            <div
              style={{
                fontStyle: "italic",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Schools Division Superintendent
            </div>
          </div>
        </div>

        <PrintFooter />
      </div>
    </div>
  );
});

PrintOathOfOffice.displayName = "PrintOathOfOffice";
