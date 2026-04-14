/* eslint-disable @next/next/no-img-element */
"use client";

import type { Employee } from "@/types";
import { NosaTypes, SignatoriesTypes } from "@/types";
import { formatToPesos } from "@/utils/text-helper";
import { format } from "date-fns";
import * as React from "react";

interface ComponentToPrintProps {
  selectedItem: NosaTypes;
  signatories: SignatoriesTypes;
}

const FOLIO_WIDTH_PX = 816; // 8.5in at 96dpi (folio: 8.5" x 13")
const CONTENT_WIDTH = 740; // folio minus 20mm margins (10mm each side)
const PRINT_MARGIN = "10mm";

function SignatoryBlock({
  user,
  name,
  position,
}: {
  user?: Employee | null;
  name: string;
  position: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div>
        {user?.signature_path ? (
          <img
            src={user.signature_path}
            alt=""
            width={48}
            height={48}
            className="object-contain"
          />
        ) : (
          <span>SGD</span>
        )}
      </div>
      <div className="font-bold border-t border-t-black mt-1 text-sm">
        {user
          ? [user.firstname, user.middlename, user.lastname]
              .filter(Boolean)
              .join(" ")
          : name}
      </div>
      <div className="text-xs">{position}</div>
    </div>
  );
}

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
    const lastName = selectedItem.hrm_user?.lastname;
    const firstAndMiddle = [
      selectedItem.hrm_user?.firstname,
      selectedItem.hrm_user?.middlename,
    ]
      .filter(Boolean)
      .join(" ");
    const userName = [lastName, firstAndMiddle].filter(Boolean).join(", ");

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
            size: 8.5in 13in;
            margin: ${PRINT_MARGIN};
          }
          .print-nosa-container {
            width: 100% !important;
            max-width: ${FOLIO_WIDTH_PX}px;
            box-sizing: border-box;
          }
        }
      `}</style>
      <div
        ref={ref}
        className={`print-nosa-container w-[${CONTENT_WIDTH}px] max-w-full bg-white py-2 px-[10mm] min-h-0`}
        style={{ width: CONTENT_WIDTH }}
      >
        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex justify-center">
            <img
              src="/deped_header.png"
              alt="DepEd Logo"
              width={140}
              height={140}
              className="object-contain"
            />
          </div>
          <div className="text-sm mt-1">
            SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
          </div>
          <hr className="border-black mt-1" />
        </div>

        {/* Title */}
        <div className="text-center mt-2 mb-3">
          <h1 className="text-xl font-bold leading-tight">
            Notice of Salary Adjustment
          </h1>
        </div>

        {/* Body */}
        <div className="text-sm space-y-2">
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
        <table className="w-full mt-4 text-sm table-fixed">
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
        <div className="indent-8 mt-4 text-sm text-justify">
          It is understood that this salary adjustment is subject to review and
          post-audit, and to appropriate re-adjustment and refund if found not
          in order.
        </div>

        {/* Signatories - Very truly yours */}
        <div className="flex justify-evenly mt-6 text-sm gap-4">
          <div className="text-center flex-1" />
          <div className="text-center flex-1">
            <div>Very truly yours,</div>
            <div className="mt-4">
              <SignatoryBlock
                user={signatories.truly_yours_user}
                name={signatories.truly_yours ?? ""}
                position={signatories.truly_yours_position ?? ""}
              />
            </div>
          </div>
        </div>

        {/* Recommending Approval */}
        <div className="text-center mt-4 text-sm">Recommending Approval:</div>
        <div className="flex justify-evenly mt-2 text-sm gap-4">
          <div className="text-center flex-1">
            <SignatoryBlock
              user={signatories.recommending_1_user}
              name={signatories.recommending_1 ?? ""}
              position={signatories.recommending_1_position ?? ""}
            />
          </div>
          <div className="text-center flex-1">
            <SignatoryBlock
              user={signatories.recommending_2_user}
              name={signatories.recommending_2 ?? ""}
              position={signatories.recommending_2_position ?? ""}
            />
          </div>
        </div>

        {/* Approved by */}
        <div className="text-center mt-4 text-sm">
          <div>Approved by:</div>
          <div className="mt-2">
            <SignatoryBlock
              user={signatories.approval_user}
              name={signatories.approval ?? ""}
              position={signatories.approval_position ?? ""}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-xs space-y-0.5">
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
        <div className="mt-6 pt-3 border-t-2 border-black flex items-start gap-4 text-xs">
          <img
            src="/logo3.png"
            alt=""
            width={96}
            height={96}
            className="object-contain flex-shrink-0"
          />
          <div>
            <div>DepEd Bldg., Palusapis Street, Poblacion, Bayugan City</div>
            <div className="text-blue-600">deped.bayugan@gmail.com</div>
            <div>Telephone Numbers: (085) 231-1496, (085) 231-1924</div>
            <div>Mobile No: 0962-837-6334</div>
          </div>
        </div>
      </div>
    </div>
  );
});

PrintNosa.displayName = "PrintNosa";
