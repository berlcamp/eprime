/* eslint-disable @next/next/no-img-element */
import { useSupabase } from "@/context/SupabaseProvider";
import { ApplicantTypes } from "@/types";
import { format } from "date-fns";
import * as React from "react";

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes;
}

/**
 * CS Form No. 32 (Narebisa / Revised 2025): Panunumpa sa Katungkulan — Oath of Office.
 * Layout follows the official CSC template exactly.
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
      {value || "\u00A0"}
    </span>
  );

  // Inline bilingual column: Filipino text on top, italic English below
  const textCol = (tl: React.ReactNode, en: React.ReactNode) => (
    <span style={{ display: "inline-flex", flexDirection: "column", verticalAlign: "top" }}>
      <span style={{ lineHeight: 1.4 }}>{tl}</span>
      <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>{en}</span>
    </span>
  );

  // Inline blank field: underline on top, centered italic label below — same fixed width in both rows
  const blankCol = (value: string, width: string, label: string) => (
    <span style={{ display: "inline-flex", flexDirection: "column", verticalAlign: "top", width, minWidth: width }}>
      <span style={{
        display: "block",
        borderBottom: "1px solid black",
        textAlign: "center",
        fontWeight: value ? "bold" : "normal",
        lineHeight: 1.4,
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}>
        {value || " "}
      </span>
      <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2, textAlign: "center", display: "block" }}>
        {label}
      </span>
    </span>
  );

  return (
    <div
      className="fixed left-[-9999px] top-0 w-[816px] print:left-0 print:relative print:m-0"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <style>{`
        @media print {
          @page { margin: 0.6in 0.7in; }
        }
      `}</style>
      <div
        ref={ref}
        className="w-[816px] bg-white px-10 py-6 print:p-0 print:m-0"
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

        {/* Body */}
        <div
          style={{
            marginTop: "28px",
            fontSize: "17px",
            lineHeight: 1.4,
            paddingLeft: "40px",
            paddingRight: "40px",
          }}
        >
          {/*
           * Lines 1–2 use inline-flex "bilingual columns": each text chunk and
           * each blank is its own column, Filipino on row-1 and English on row-2,
           * so labels are always centred directly under their blank underline.
           *
           * Lines 3–8 use a plain two-div structure (Filipino above, italic
           * English below) — no absolute positioning, no clipping height.
           * Line 3 uses a flex split so the English begins where the un-translated
           * "sa abot ng aking kakayahan" phrase starts (~200 px in).
           */}

          {/* Line 1: Ako si ___ , ng ___ , na */}
          <div style={{ marginTop: "8px", paddingLeft: "48px" }}>
            {textCol("Ako si ", "I, ")}
            {blankCol(fullName, "310px", "(Name of Appointee)")}
            {textCol(", ng ", ", ")}
            {blankCol(address, "190px", "(Address)")}
            {textCol(", na", ", having")}
          </div>

          {/* Line 2: itinalaga bilang ___ , ay taimtim... */}
          <div style={{ marginTop: "10px" }}>
            {textCol("itinalaga bilang ", "been appointed to ")}
            {blankCol(positionName, "265px", "(Position)")}
            {textCol(
              ", ay taimtim na nanunumpa na tutuparin ko nang",
              ", hereby solemnly swear, that I will faithfully discharge",
            )}
          </div>

          {/*
           * Lines 3–8: each line is a flex row of segments distributed with
           * justify-content: space-between so the Filipino text spans the full
           * width (justified). Each segment is a column: Filipino on top,
           * italic English translation directly below — so the translation
           * always sits under its corresponding Filipino phrase.
           */}

          {/* Line 3 — 3 Filipino segments; first has no English translation */}
          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>buong husay at katapatan,</span>
              <span style={{ fontSize: "13px", lineHeight: 1.2 }}>&nbsp;</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>sa abot ng aking kakayahan,</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>to the best of my ability,</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>ang mga katungkulang pinagtalagahan sa akin</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>the duties of my present position</span>
            </div>
          </div>

          {/* Line 4 */}
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>at sa dapat gampanan sa iba pang pagkaraan nito&apos;y gagampanan ko</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>and of all others that I may hereafter hold</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>sa ilalim ng Republika ng Pilipinas;</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>under the Republic of the Philippines;</span>
            </div>
          </div>

          {/* Line 5 */}
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>na aking itataguyod at ipagtatanggol ang Saligang Batas ng Pilipinas;</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>to uphold and defend the Constitution,</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>na tunay na mananalig at</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>that I will bear true faith</span>
            </div>
          </div>

          {/* Line 6 — 3 segments */}
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>tatalima ako rito;</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>and allegiance to the same;</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>na susundin ko ang mga batas at mga kautusang legal,</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>that I will obey the laws, legal orders, and</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>at mga dekretong pinaiiral</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>decrees promulgated</span>
            </div>
          </div>

          {/* Line 7 */}
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>ng mga sadyang itinakdang maykapangyarihan ng Republika ng Pilipinas;</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>by the duly constituted authorities of the Republic of the Philippines;</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.4 }}>at kusa kong babalikatin</span>
              <span style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>and that I impose</span>
            </div>
          </div>

          {/* Line 8 — single segment */}
          <div style={{ marginTop: "10px" }}>
            <div style={{ lineHeight: 1.4 }}>
              ang pananagutang ito nang walang ano mang pasubali o hangaring umiwas.
            </div>
            <div style={{ fontStyle: "italic", fontSize: "13px", lineHeight: 1.2 }}>
              this obligation upon myself voluntarily, without mental reservation or purpose of evasion.
            </div>
          </div>

          {/* Kasihan nawa... */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ textIndent: "48px", fontWeight: "bold" }}>
              KASIHAN NAWA AKO NG DIYOS.
            </div>
            <div
              style={{
                fontStyle: "italic",
                fontSize: "15px",
                textIndent: "80px",
              }}
            >
              SO HELP ME GOD.
            </div>
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
              {sdsName || "\u00A0"}
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
      </div>
    </div>
  );
});

PrintOathOfOffice.displayName = "PrintOathOfOffice";
