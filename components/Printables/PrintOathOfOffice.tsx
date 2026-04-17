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

  const engLabel: React.CSSProperties = {
    fontStyle: "italic",
    fontSize: "11px",
    lineHeight: 1.1,
    position: "absolute",
    whiteSpace: "nowrap",
  };

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
            fontSize: "15px",
            lineHeight: 1.4,
          }}
        >
          {/* Line 1: Ako si ___ , ng ___ , na */}
          <div style={{ position: "relative", marginTop: "8px" }}>
            <div style={{ textIndent: "48px" }}>
              Ako si {blank(fullName, "360px")}, ng{blank(address, "210px")}, na
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "52px" }}>I ,</span>
              <span style={{ ...engLabel, left: "230px" }}>
                (Name of Appointee)
              </span>
              <span style={{ ...engLabel, left: "540px" }}>(Address)</span>
              <span style={{ ...engLabel, right: "0" }}>,having</span>
            </div>
          </div>

          {/* Line 2: itinalaga bilang ___ , ay taimtim... */}
          <div style={{ position: "relative", marginTop: "14px" }}>
            <div>
              itinalaga bilang {blank(positionName, "280px")}, ay taimtim na
              nanunumpa na tutuparin ko nang
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "0" }}>been appointed to</span>
              <span style={{ ...engLabel, left: "215px" }}>(Position)</span>
              <span style={{ ...engLabel, left: "370px" }}>
                ,hereby solemnly swear, that I will faithfully discharge
              </span>
            </div>
          </div>

          {/* Line 3: buong husay... pinagtalagahan sa akin */}
          <div style={{ position: "relative", marginTop: "14px" }}>
            <div>
              buong husay at katapatan, sa abot ng aking kakayahan, ang mga
              katungkulang pinagtalagahan sa akin
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "80px" }}>
                to the best of my ability,
              </span>
              <span style={{ ...engLabel, right: "20px" }}>
                the duties of my present position
              </span>
            </div>
          </div>

          {/* Line 4: at sa dapat gampanan... Republika ng Pilipinas; */}
          <div style={{ position: "relative", marginTop: "14px" }}>
            <div>
              at sa dapat gampanan sa iba pang pagkaraan nito&apos;y gagampanan
              ko sa ilalim ng Republika ng Pilipinas;
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "30px" }}>
                and of all others that I may hereafter hold
              </span>
              <span style={{ ...engLabel, right: "0" }}>
                under the Republic of the Philippines;
              </span>
            </div>
          </div>

          {/* Line 5: na aking itataguyod... mananalig at */}
          <div style={{ position: "relative", marginTop: "14px" }}>
            <div>
              na aking itataguyod at ipagtatanggol ang Saligang Batas ng
              Pilipinas; na tunay na mananalig at
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "110px" }}>
                to uphold and defend the Constitution,
              </span>
              <span style={{ ...engLabel, right: "0" }}>
                that I will bear true faith
              </span>
            </div>
          </div>

          {/* Line 6: tatalima ako rito... dekretong pinaiiral */}
          <div style={{ position: "relative", marginTop: "14px" }}>
            <div>
              tatalima ako rito; na susundin ko ang mga batas at mga kautusang
              legal, at mga dekretong pinaiiral
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "0" }}>
                and allegiance to the same;
              </span>
              <span style={{ ...engLabel, left: "210px" }}>
                that I will obey the laws, legal orders, and
              </span>
              <span style={{ ...engLabel, right: "0" }}>
                decrees promulgated
              </span>
            </div>
          </div>

          {/* Line 7: ng mga sadyang itinakdang... babalikatin */}
          <div style={{ position: "relative", marginTop: "14px" }}>
            <div>
              ng mga sadyang itinakdang maykapangyarihan ng Republika ng
              Pilipinas; at kusa kong babalikatin
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "60px" }}>
                by the duly constituted authorities of the Republic of the
                Philippines;
              </span>
              <span style={{ ...engLabel, right: "0" }}>
                and that I impose
              </span>
            </div>
          </div>

          {/* Line 8: ang pananagutang ito... umiwas. */}
          <div style={{ position: "relative", marginTop: "14px" }}>
            <div>
              ang pananagutang ito nang walang ano mang pasubali o hangaring
              umiwas.
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <span style={{ ...engLabel, left: "0" }}>
                this obligation upon myself voluntarily, without mental
                reservation or purpose of evasion.
              </span>
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
                fontSize: "13px",
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
            <div
              style={{
                borderBottom: "1px solid black",
                height: "20px",
              }}
            />
            <div style={{ fontWeight: "bold", fontSize: "15px" }}>
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
