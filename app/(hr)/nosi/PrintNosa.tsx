/* eslint-disable @next/next/no-img-element */
"use client";

import { NosaTypes, SignatoriesTypes } from "@/types";
import { formatToPesos } from "@/utils/text-helper";
import { format } from "date-fns";
import * as React from "react";

interface ComponentToPrintProps {
  selectedItem: NosaTypes;
  signatories: SignatoriesTypes;
}

const A4_WIDTH_PX = 794; // 210mm at 96dpi
const CONTENT_WIDTH = 734; // A4 minus 30mm margins (15mm each side)

export const PrintNosa = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem, signatories } = props;

  const computed = React.useMemo(() => {
    const effectiveDate = selectedItem.effective_date
      ? new Date(selectedItem.effective_date)
      : new Date();
    const asOfDate = selectedItem.as_of_date
      ? new Date(selectedItem.as_of_date)
      : new Date();
    const prevAmount = Number(selectedItem.previous_amount) || 0;
    const newAmount = Number(selectedItem.new_amount) || 0;
    const amountDiff = newAmount - prevAmount;
    const fyYear = effectiveDate.getFullYear();
    const userName = [
      selectedItem.hrm_user?.lastname,
      selectedItem.hrm_user?.firstname,
      selectedItem.hrm_user?.middlename,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      effectiveDate,
      asOfDate,
      prevAmount,
      newAmount,
      amountDiff,
      fyYear,
      userName,
    };
  }, [selectedItem]);

  return (
    <div className="invisible print:visible">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          .print-nosa-container {
            width: 100% !important;
            max-width: ${A4_WIDTH_PX}px;
            box-sizing: border-box;
          }
        }
      `}</style>
      <div
        ref={ref}
        className={`print-nosa-container w-[${CONTENT_WIDTH}px] max-w-full bg-white py-4 px-[15mm] min-h-0`}
        style={{ width: CONTENT_WIDTH }}
      >
        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex justify-center">
            <img
              src="/deped_header.png"
              alt="DepEd Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <div className="text-[11px] mt-1">
            SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
          </div>
          <hr className="border-black mt-1" />
        </div>

        {/* Title */}
        <div className="text-center mt-2 mb-3">
          <h1 className="text-lg font-bold leading-tight">
            Notice of Salary Adjustment
          </h1>
        </div>

        {/* Body */}
        <div className="text-[11px] space-y-2">
          <div className="text-right">
            {format(new Date(), "MMMM dd, yyyy")}
          </div>

          <div className="mt-4">
            <div className="font-bold uppercase">{computed.userName}</div>
            <div>{selectedItem.hrm_user?.hrm_positions?.name ?? "—"}</div>
            <div className="uppercase">
              {selectedItem.hrm_user?.hrm_schools?.name}{" "}
              {selectedItem.hrm_user?.hrm_offices?.name}
            </div>
          </div>

          <div className="mt-4">Sir/Ma&apos;am:</div>

          <div className="mt-4 indent-8 text-justify">
            {signatories.first_paragraph}{" "}
            <span className="font-bold underline">
              {format(computed.effectiveDate, "MMMM dd, yyyy")}
            </span>
            , as follows:
          </div>
        </div>

        {/* Salary table */}
        <table className="w-full mt-4 text-[11px] table-fixed">
          <tbody>
            <tr>
              <td className="py-0.5 align-top">
                <div>
                  1. Adjusted monthly basic salary effective{" "}
                  <span className="font-bold">
                    {format(computed.effectiveDate, "MMMM dd, yyyy")}
                  </span>
                  ,
                </div>
                <div className="ml-4">
                  under the new Salary Schedule; (SG{" "}
                  <span className="font-bold underline">
                    {selectedItem.new_grade}
                  </span>
                  , step{" "}
                  <span className="font-bold underline">
                    {selectedItem.new_step}
                  </span>
                  )
                </div>
              </td>
              <td className="py-0.5 align-top text-right w-24">
                {formatToPesos(computed.newAmount)}
              </td>
            </tr>
            <tr>
              <td className="py-1 align-top">
                <div>
                  2. Actual monthly basic salary as of{" "}
                  <span className="font-bold">
                    {format(computed.asOfDate, "MMMM dd, yyyy")}
                  </span>
                  ;
                </div>
                <div className="ml-4">
                  SG{" "}
                  <span className="font-bold underline">
                    {selectedItem.previous_grade}
                  </span>{" "}
                  Step{" "}
                  <span className="font-bold underline">
                    {selectedItem.previous_step}
                  </span>
                </div>
              </td>
              <td className="py-1 align-top text-right">
                {formatToPesos(computed.prevAmount)}
              </td>
            </tr>
            <tr>
              <td className="py-1 align-top">
                <div>
                  3. Monthly salary adjustment effective{" "}
                  <span className="font-bold">
                    {format(computed.effectiveDate, "MMMM dd, yyyy")}
                  </span>
                </div>
              </td>
              <td className="py-1 align-top text-right underline underline-offset-1">
                {formatToPesos(computed.amountDiff)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Disclaimer */}
        <div className="indent-8 mt-4 text-[11px] text-justify">
          It is understood that this salary adjustment is subject to review and
          post-audit, and to appropriate re-adjustment and refund if found not
          in order.
        </div>

        {/* Signatories - Very truly yours */}
        <div className="flex justify-evenly mt-8 text-[11px] gap-4">
          <div className="text-center flex-1" />
          <div className="text-center flex-1">
            <div>Very truly yours,</div>
            <div className="mt-4 font-bold">{signatories.truly_yours}</div>
            <div>{signatories.truly_yours_position}</div>
          </div>
        </div>

        {/* Recommending Approval */}
        <div className="text-center mt-4 text-[11px]">
          Recommending Approval:
        </div>
        <div className="flex justify-evenly mt-2 text-[11px] gap-4">
          <div className="text-center flex-1">
            <div className="mt-2 font-bold">{signatories.recommending_1}</div>
            <div>{signatories.recommending_1_position}</div>
          </div>
          <div className="text-center flex-1">
            <div className="mt-2 font-bold">{signatories.recommending_2}</div>
            <div>{signatories.recommending_2_position}</div>
          </div>
        </div>

        {/* Approved by */}
        <div className="text-center mt-4 text-[11px]">
          <div>Approved by:</div>
          <div className="mt-2 font-bold">{signatories.approval}</div>
          <div>{signatories.approval_position}</div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-[10px] space-y-0.5">
          <div>
            Position Title: {selectedItem.hrm_user?.hrm_positions?.name ?? "—"}
          </div>
          <div>Salary Grade: {selectedItem.new_grade}</div>
          <div>
            Item No./Unique No., FY {computed.fyYear} personal Services
            Itemization
          </div>
          <div>
            And/or Plantilla of Personnel:{" "}
            {selectedItem.hrm_user?.hrm_item?.item_number ?? "—"}
          </div>
          <div>Copy Furnished: GSIS, DPSU</div>
        </div>

        {/* Footer branding - in document flow for print */}
        <div className="mt-6 pt-3 border-t-2 border-black flex items-start gap-4 text-[10px]">
          <img
            src="/logo3.png"
            alt=""
            width={80}
            height={80}
            className="object-contain flex-shrink-0"
          />
          <div>
            <div>DepEd Bldg., Palusapis Street, Poblacion, Bayugan City</div>
            <div className="text-blue-600">deped.bayugan@gmail.com</div>
            <div>Telephone Numbers: (085) 231-1496, (085) 231-1924</div>
            <div>Mobile No: 0962-867-6334</div>
          </div>
        </div>
      </div>
    </div>
  );
});

PrintNosa.displayName = "PrintNosa";
