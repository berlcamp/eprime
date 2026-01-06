/* eslint-disable @next/next/no-img-element */
import { DocumentTypes } from "@/types";
import { format } from "date-fns";
import { SquareCheckIcon, SquareIcon } from "lucide-react";
import * as React from "react";

interface ComponentToPrintProps {
  selectedItem: DocumentTypes;
}

export const PrintLeaveForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props;

  const d: DocumentTypes = selectedItem;
  let daysWithPay = 0;
  // if (d.certified_by) {
  d.leave_dates.forEach((d) => {
    if (d.is_paid) {
      daysWithPay++;
    }
  });
  // }
  console.log(daysWithPay);

  return (
    <div className="invisible">
      <div ref={ref} className="w-[816px] bg-white py-2 px-4">
        <table className="w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="relative text-center">
                <div className="absolute top-0 left-0 w-[200px] text-left">
                  <div className="italic text-[10px] font-bold">
                    Civil Service Form No. 6
                  </div>
                  <div className="italic text-[10px] font-bold">
                    Revised 2020
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div>
                    <img
                      src="/images/bayugan_logo.png"
                      alt=""
                      width={100}
                      height={100}
                    />
                  </div>
                  <div className="w-[300px]">
                    <div className="text-xs font-bold">
                      Republic of the Philippines
                    </div>
                    <div className="font-bold text-lg">
                      Department of Education
                    </div>
                    <div className="text-xs font-bold">
                      Division of Bayugan City
                    </div>
                  </div>
                  <div>
                    <img
                      src="/images/deped_logo.png"
                      alt=""
                      width={100}
                      height={100}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-center">
                <div className="font-bold text-2xl py-4">
                  APPLICATION FOR LEAVE
                </div>
              </td>
            </tr>
            <tr className="border-2 border-black">
              <td className="p-1">
                <div className="text-xs">1. OFFICE/DEPARTMENT</div>
                <div className=" uppercase font-bold pl-10">DEPED</div>
              </td>
              <td>
                <div className="text-xs flex items-center justify-start">
                  <span className="w-20">2. NAME:</span>
                  <span className="w-20">(Last)</span>
                  <span className="w-20"> (First)</span>
                  <span> (Middle)</span>
                </div>
                <div className="uppercase font-bold pl-10">
                  {selectedItem.creator.lastname},{" "}
                  {selectedItem.creator.firstname}{" "}
                  {selectedItem.creator.middlename}
                </div>
              </td>
            </tr>
            <tr className="border-2 border-black">
              <td colSpan={2} className="py-2">
                <div className="text-xs space-x-2 space-y-2">
                  <div className="inline-flex">
                    <span>3. DATE OF FILING: </span>
                    <span className="underline underline-offset-2 font-bold">
                      {format(
                        new Date(selectedItem.created_at),
                        "MMMM d, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="inline-flex">
                    <span>4. POSITION: </span>
                    <span className="font-bold underline uppercase">
                      <span>{selectedItem.creator.hrm_positions?.name}</span>
                    </span>
                  </div>
                  <div className="inline-flex">
                    <span>5. SALARY: </span>
                    <span className="font-bold underline uppercase">
                      {selectedItem.creator.hrm_item && (
                        <span>
                          {selectedItem.creator.hrm_item.actual_annual_salary}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-2 border-black">
              <td colSpan={2} className="text-center">
                <div className="font-bold text-lg">
                  6. DETAILS OF APPLICATION
                </div>
              </td>
            </tr>
            <tr>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div>6.A TYPE OF LEAVE TO BE AVAILED OF</div>
                <div className="pl-2">
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Vacation Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Vacation Leave{" "}
                      <span className="text-[8px]">
                        (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Mandatory/Forced Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Mandatory/Forced Leave
                      <span className="text-[8px]">
                        (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Sick Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Sick Leave{" "}
                      <span className="text-[8px]">
                        (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Maternity Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Maternity Leave{" "}
                      <span className="text-[8px]">
                        (R.A. No. 11210 / IRR issued by CSC, DOLE and SSS)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Paternity Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Paternity Leave{" "}
                      <span className="text-[8px]">
                        (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Special Privilege Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Special Privilege Leave{" "}
                      <span className="text-[8px]">
                        (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Solo Parent Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Solo Parent Leave{" "}
                      <span className="text-[8px]">
                        (RA No. 8972 / CSC MC No. 8, s. 2004)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Study Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Study Leave{" "}
                      <span className="text-[8px]">
                        (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "10-Day VAWC Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      10-Day VAWC Leave{" "}
                      <span className="text-[8px]">
                        (RA No. 9262 / CSC MC No. 15, s. 2005)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Rehabilitation Privilege" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Rehabilitation Privilege{" "}
                      <span className="text-[8px]">
                        (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type ===
                    "Special Leave Benefits for Women" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Special Leave Benefits for Women{" "}
                      <span className="text-[8px]">
                        (RA No. 9710 / CSC MC No. 25, s. 2010)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type ===
                    "Special Emergency (Calamity) Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Special Emergency (Calamity) Leave{" "}
                      <span className="text-[8px]">
                        (CSC MC No. 2, s. 2012, as amended)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_type === "Adoption Leave" ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>
                      Adoption Leave{" "}
                      <span className="text-[8px]">(R.A. No. 8552) </span>
                    </span>
                  </div>
                  <div className="mt-1 italic">Others: </div>
                  <div className="mt-1">
                    {selectedItem.leave_type === "Others" ? (
                      <span className="underline">
                        {selectedItem.leave_others_specify}
                      </span>
                    ) : selectedItem.leave_type === "Compensatory Time Off" ? (
                      <span className="underline">Compensatory Time Off</span>
                    ) : (
                      <span>______________________________________</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div>6.B DETAILS OF LEAVE </div>
                <div className="pl-10 mt-2">
                  <div className="italic">
                    In case of Vacation/Special Privilege Leave:
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_location ===
                    "Within the Philippines" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>
                          Within the Philippines{" "}
                          <span className="underline underline-offset-2">
                            {selectedItem.leave_specify_location}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>
                          Within the Philippines __________________________
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_location === "Abroad" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>
                          Abroad (Specify){" "}
                          <span className="underline underline-offset-2">
                            {selectedItem.leave_specify_location}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>
                          <span>
                            Abroad (Specify) _____________________________
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  <div className="italic mt-2">In case of Sick Leave:</div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_hospitalization === "In Hospital" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>
                          In Hospital (Specify Illness){" "}
                          <span className="underline underline-offset-2">
                            {selectedItem.leave_illness}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>
                          In Hospital (Specify Illness) _____________________
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_hospitalization === "Out Patient" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>
                          Out Patient (Specify Illness){" "}
                          <span className="underline underline-offset-2">
                            {selectedItem.leave_illness}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>
                          Out Patient (Specify Illness) _____________________
                        </span>
                      </>
                    )}
                  </div>
                  <div className="italic mt-2">
                    In case of Special Leave Benefits for Women:
                  </div>
                  {selectedItem.leave_type ===
                  "Special Leave Benefits for Women" ? (
                    <>
                      <div>
                        (Specify Illness){" "}
                        <span className="underline underline-offset-2">
                          {selectedItem.leave_women_illness}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        (Specify Illness) ________________________________
                      </div>
                      <div>_______________________________________________</div>
                    </>
                  )}

                  <div className="italic mt-2">In case of Study Leave:</div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_study_purpose ===
                    "Completion of Masters Degree" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>Completion of Master's Degree</span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>Completion of Master's Degree</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_study_purpose ===
                    "BAR/Board Examination Review" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>BAR/Board Examination Review</span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>BAR/Board Examination Review</span>
                      </>
                    )}
                  </div>
                  <div className="italic mt-2">Other purpose:</div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_other_purpose ===
                    "Monetization of Leave Credits" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>Monetization of Leave Credits</span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>Monetization of Leave Credits</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_other_purpose === "Terminal Leave" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>Terminal Leave</span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>Terminal Leave</span>
                      </>
                    )}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div>6.C NUMBER OF WORKING DAYS APPLIED FOR</div>
                <div className="pl-10 font-bold underline uppercase">
                  {selectedItem.leave_days} day/s
                </div>
                <div className="pl-10 mt-1">INCLUSIVE DATES</div>
                <div className="pl-10 font-bold underline uppercase">
                  {selectedItem.leave_dates?.length > 5 ? (
                    <span>
                      From{" "}
                      <span>
                        {format(
                          new Date(
                            selectedItem.leave_dates
                              .slice() // Create a shallow copy to avoid mutating the original array
                              .sort(
                                (a, b) =>
                                  new Date(a.date).getTime() -
                                  new Date(b.date).getTime()
                              )[0].date
                          ),
                          "MMM d, yyyy"
                        )}
                      </span>{" "}
                      to{" "}
                      <span>
                        {format(
                          new Date(
                            selectedItem.leave_dates
                              .slice() // Create a shallow copy to avoid mutating the original array
                              .sort(
                                (a, b) =>
                                  new Date(a.date).getTime() -
                                  new Date(b.date).getTime()
                              )[selectedItem.leave_dates.length - 1].date
                          ),
                          "MMM d, yyyy"
                        )}
                      </span>
                    </span>
                  ) : (
                    selectedItem.leave_dates?.map((day, index) => (
                      <span key={day.id}>
                        {format(new Date(day.date), "MMM d, yyyy")}
                        {index < selectedItem.leave_dates.length - 1 && ", "}
                      </span>
                    ))
                  )}
                </div>
              </td>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div> 6.D COMMUTATION </div>
                <div className="pl-10">
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_commutation === "Not Requested" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>Not Requested</span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>Not Requested</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.leave_commutation === "Requested" ? (
                      <>
                        <SquareCheckIcon className="w-5 h-4" />
                        <span>Requested</span>
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-5 h-4" />
                        <span>Requested</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center">
                    {selectedItem.creator?.signature_path ? (
                      <img
                        src={selectedItem.creator?.signature_path}
                        alt=""
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span>SGD</span>
                    )}
                  </div>
                  <div className="font-bold border-t border-t-black">
                    {selectedItem.creator.lastname},{" "}
                    {selectedItem.creator.firstname}{" "}
                    {selectedItem.creator.middlename}
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-2 border-black">
              <td colSpan={2} className="text-center">
                <div className="font-bold text-lg">
                  7. DETAILS OF ACTION ON APPLICATION
                </div>
              </td>
            </tr>

            <tr>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div>7.A CERTIFICATION OF LEAVE CREDITS</div>
                <div className="pl-10 mt-2">
                  As of{" "}
                  <span className="font-bold underline">
                    {selectedItem.certification_as_of &&
                      format(
                        new Date(selectedItem.certification_as_of),
                        "MMMM d, yyyy"
                      )}
                  </span>
                </div>
                <div className="pl-10 mt-1">
                  <table>
                    <thead>
                      <tr>
                        <td className="border px-1 border-black"></td>
                        {selectedItem.credits_used?.map((item) => (
                          <td
                            key={item.type}
                            className="border px-1 border-black"
                          >
                            {item.type}
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center border px-1 border-black italic">
                          Total Earned
                        </td>
                        {selectedItem.credits_used?.map((item) => (
                          <td
                            key={`earned-${item.type}`}
                            className="border px-1 border-black"
                          >
                            {item.original_balance}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="text-center border px-1 border-black italic">
                          Less this application
                        </td>
                        {selectedItem.credits_used?.map((item) => (
                          <td
                            key={`less-${item.type}`}
                            className="border px-1 border-black"
                          >
                            {item.balance}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="text-center border px-1 border-black italic">
                          Balance
                        </td>
                        {selectedItem.credits_used?.map((item) => (
                          <td
                            key={`balance-${item.type}`}
                            className="border px-1 border-black"
                          >
                            {Number(item.original_balance) -
                              Number(item.balance)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="w-full mt-2 flex flex-col items-center justify-center">
                  <div className="font-bold">
                    {selectedItem.certifier?.signature_path ? (
                      <img
                        src={selectedItem.certifier?.signature_path}
                        alt=""
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span>SGD</span>
                    )}
                  </div>
                  <div className="font-bold border-t border-t-black">
                    {selectedItem.certifier?.lastname},{" "}
                    {selectedItem.certifier?.firstname}{" "}
                    {selectedItem.certifier?.middlename}
                  </div>
                </div>
              </td>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div>7.B RECOMMENDATION</div>
                <div className="pl-10 mt-2">
                  <div className="flex items-start justify-start space-x-1">
                    <SquareCheckIcon className="w-5 h-4" />
                    <span>For approval</span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>For disapproval due to _______________________</span>
                  </div>
                  <div>______________________________________________</div>
                  <div>______________________________________________</div>
                  <div>______________________________________________</div>
                </div>
                <div className="w-full mt-2 flex flex-col items-center justify-center">
                  <div className="font-bold">
                    {selectedItem.recommender?.signature_path ? (
                      <img
                        src={selectedItem.recommender?.signature_path}
                        alt=""
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span>SGD</span>
                    )}
                  </div>
                  <div className="font-bold border-t border-t-black">
                    {selectedItem.recommender?.lastname},{" "}
                    {selectedItem.recommender?.firstname}{" "}
                    {selectedItem.recommender?.middlename}
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-t-2 border-l-2 border-r-2 border-black">
              <td className="align-top p-1 text-xs">
                <div>7.C APPROVED FOR:</div>
                {selectedItem.leave_type === "Terminal/Monetization Leave" ? (
                  <div className="pl-10 mt-2">
                    <div>
                      <span className="underline underline-offset-1 font-bold">
                        0
                      </span>{" "}
                      days with pay
                    </div>
                    <div>
                      <span className="underline underline-offset-1 font-bold">
                        0
                      </span>{" "}
                      days without pay
                    </div>
                    <div>
                      <span className="underline underline-offset-1 font-bold">
                        {selectedItem.leave_days}
                      </span>{" "}
                      others (Monetization)
                    </div>
                  </div>
                ) : (
                  <div className="pl-10 mt-2">
                    <div>
                      <span className="underline underline-offset-1 font-bold">
                        {daysWithPay}
                      </span>{" "}
                      days with pay
                    </div>
                    <div>
                      <span className="underline underline-offset-1 font-bold">
                        {Number(selectedItem.leave_dates?.length) - daysWithPay}
                      </span>{" "}
                      days without pay
                    </div>
                    <div>________ others (Specify)</div>
                  </div>
                )}
              </td>
              <td className="align-top p-1 text-xs">
                <div>7.D DISAPPROVED DUE TO:</div>
                <div className="pl-10 mt-2">
                  <div>__________________________________________________</div>
                  <div>__________________________________________________</div>
                  <div>__________________________________________________</div>
                </div>
              </td>
            </tr>
            <tr className="border-b-2 border-l-2 border-r-2 border-black">
              <td colSpan={2} className="align-top p-1 text-xs">
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="font-bold">
                    {selectedItem.finalapprover?.signature_path ? (
                      <img
                        src={selectedItem.finalapprover?.signature_path}
                        alt=""
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span>SGD</span>
                    )}
                  </div>
                  <div className="font-bold border-t border-t-black">
                    {selectedItem.finalapprover?.lastname},{" "}
                    {selectedItem.finalapprover?.firstname}{" "}
                    {selectedItem.finalapprover?.middlename}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="">
                <div className="text-xs italic">
                  (This is a system generated form)
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});
