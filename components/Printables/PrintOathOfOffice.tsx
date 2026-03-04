/* eslint-disable @next/next/no-img-element */
import { ApplicantTypes } from "@/types";
import * as React from "react";
import { PrintFooter } from "./PrintFooter";
import { PrintHeader } from "./PrintHeader";

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes;
}

const Eng = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] italic font-normal leading-tight">{children}</div>
);

/**
 * CS Form No. 32: Oath of Office (PANUNUMPA SA KATUNGKULAN)
 * CSC standard format - Narebisa 2025 / Revised 2025
 */
export const PrintOathOfOffice = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props;

  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    "N/A";
  const fullName = `${selectedItem.firstname} ${selectedItem.middlename} ${selectedItem.lastname}`;
  const address = selectedItem?.address || "________________";

  return (
    <div
      className="fixed left-[-9999px] top-0 w-[816px] print:left-0 print:relative print:m-0"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <div
        ref={ref}
        className="w-[816px] bg-white py-2 px-8 m-12 print:m-0 print:p-0 print:pb-36 text-[15px]"
        style={{ fontFamily: "Times New Roman, serif" }}
      >
        {/* Upper left form info - fixed to top of paper */}
        <div className="text-[12px] leading-tight mb-2">
          <div>SS Porma Blg. 32</div>
          <div>CS Form No. 32</div>
          <div className="mt-1" />
          <div>Narebisa 2025</div>
          <div>Revised 2025</div>
        </div>

        <PrintHeader />

        <div className="text-center mt-10">
          <div className="font-bold text-2xl">PANUNUMPA SA KATUNGKULAN</div>
        </div>

        {/* Oath content - 12px Tagalog, 9px English */}
        <div
          className="mt-14 px-1 text-[16px]"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          <div className="indent-8">
            {/* Ako si [name], ng */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              Ako si{" "}
              <span className="font-bold underline underline-offset-2">
                {fullName}
              </span>
              , ng
            </div>
            <Eng>I</Eng>

            {/* [address] na */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              <span className="font-bold underline underline-offset-2">
                {address}
              </span>{" "}
              na
            </div>
            <div className="flex justify-end text-[11px] italic font-normal leading-tight">
              <span>having</span>
            </div>

            {/* itinalaga bilang... */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              itinalaga bilang{" "}
              <span className="font-bold underline underline-offset-2">
                {positionName}
              </span>
              , ay taimtim na nanunumpa na tutuparin ko nang
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>been appointed to</span>
              <span className="ml-[32em]">
                hereby solemnly swear, that I will faithfully discharge
              </span>
            </div>

            {/* buong husay... ang mga katungkulang pinagtalagahan */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              buong husay at katapatan, sa abot ng aking kakayahan, ang mga
              katungkulang pinagtalagahan
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>to the best of my ability:</span>
              <span className="ml-[40em]">
                the duties of my present position
              </span>
            </div>

            {/* sa akin... ilalim ng */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              sa akin at sa dapat gampanan sa iba pang pagkaraan nito&apos;y
              gagampanan ko sa ilalim ng
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>and of all others that I may hereafter hold</span>
              <span className="ml-auto">under the</span>
            </div>

            {/* Republika... ipagtatanggol */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              Republika ng Pilipinas; na aking itataguyod at ipagtatanggol ang
              Saligang Batas ng Pilipinas;
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>Republic of the Philippines:</span>
              <span className="ml-[6.5em]">
                to uphold and defend the Constitution,
              </span>
            </div>

            {/* na tunay... kautusang */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              na tunay na mananalig at tatalima ako rito; na susundin ko ang mga
              batas at mga kautusang
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>
                that I will bear true faith and allegiance to the same;
              </span>
              <span className="ml-[1em]">
                that I will obey the laws, legal orders, and
              </span>
            </div>

            {/* legal... Republika */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              legal, at mga dekretong pinaiiral ng mga sadyang itinakdang
              maykapangyarihan ng Republika
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>
                decrees promulgated by the duly constituted authorities of the
                Republic
              </span>
            </div>

            {/* ng Pilipinas... pasubali */}
            <div
              className="mt-2"
              style={{ textAlign: "justify", textAlignLast: "justify" }}
            >
              ng Pilipinas; at kusa kong babalikatin ang pananagutang ito nang
              walang ano mang pasubali
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>
                of the Philippines; and that I impose this obligation upon
                myself voluntarily, without mental reservation
              </span>
            </div>

            {/* o hangaring umiwas */}
            <div className="mt-2" style={{ textAlign: "justify" }}>
              o hangaring umiwas.
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>or purpose of evasion.</span>
            </div>
          </div>

          {/* KASIHAN NAWA - indented, centered */}
          <div className="indent-8 mt-4 text-center">
            <div className="mt-2" style={{ textAlign: "justify" }}>
              KASIHAN NAWA AKO NG DIYOS
            </div>
            <div className="flex text-[11px] italic font-normal leading-tight">
              <span>SO HELP ME GOD</span>
            </div>
          </div>
        </div>

        {/* Appointee signature - right aligned */}
        <div className="mt-6 flex justify-end px-1">
          <div className="text-center">
            <div className="font-bold border-b border-black min-w-[220px]">
              {fullName}
            </div>
            <div className="text-[11px] mt-0.5 italic">
              (Lagda sa itaas ng pangalan ng hinirang)
            </div>
          </div>
        </div>

        {/* Government ID - small italic, below signatory */}
        <div className="mt-4 space-y-1 text-[13px] italic px-1">
          <div>
            Government ID:{" "}
            <span className="inline-block border-b border-black min-w-[180px] align-bottom" />
          </div>
          <div>
            Numero ng ID:{" "}
            <span className="inline-block border-b border-black min-w-[180px] align-bottom" />
          </div>
          <div>
            Araw ng Pagkakaloob:{" "}
            <span className="inline-block border-b border-black min-w-[150px] align-bottom" />
          </div>
        </div>

        <hr className="border-black mt-10 mb-10 mx-1" />

        {/* Nilagdaan section */}
        <div className="text-[16px] mt-4 px-1">
          Nilagdaan pinanumpaan sa harap ko ngayong ika{" "}
          <span className="font-bold">__________</span> ng{" "}
          <span className="font-bold">______________</span>,{" "}
          <span className="font-bold">20________</span> sa{" "}
          <span className="font-bold">___________________</span>, Pilipinas
        </div>

        <PrintFooter />
      </div>
    </div>
  );
});
