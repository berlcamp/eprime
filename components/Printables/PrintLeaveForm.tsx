import { DocumentTypes } from '@/types'
import { format } from 'date-fns'
import { SquareCheckIcon, SquareIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: DocumentTypes
}

export const PrintLeaveForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

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
                    <Image
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
                    <Image
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
                  {selectedItem.creator.lastname},{' '}
                  {selectedItem.creator.firstname}{' '}
                  {selectedItem.creator.middlename}
                </div>
              </td>
            </tr>
            <tr className="border-2 border-black">
              <td className="py-2">
                <div className="text-xs">
                  3. DATE OF FILING:{' '}
                  <span className="underline underline-offset-2 font-bold">
                    {format(new Date(selectedItem.created_at), 'MMMM d, yyyy')}
                  </span>
                </div>
              </td>
              <td>
                <div className="text-xs flex items-center justify-evenly">
                  <span>
                    4. POSITION:{' '}
                    <span className="font-bold underline uppercase">
                      {selectedItem.creator.hrm_item ? (
                        <span>
                          {selectedItem.creator.hrm_item.hrm_position?.name}
                        </span>
                      ) : (
                        <span>{selectedItem.creator.hrm_positions?.name}</span>
                      )}
                    </span>
                  </span>
                  <span>
                    5. SALARY:{' '}
                    <span className="font-bold underline uppercase">
                      {selectedItem.creator.hrm_item ? (
                        <span>
                          {selectedItem.creator.hrm_item.actual_annual_salary}
                        </span>
                      ) : (
                        <span>{selectedItem.creator.hrm_positions?.name}</span>
                      )}
                    </span>
                  </span>
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
                <div className="pl-5">
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Vacation Leave{' '}
                      <span className="text-[8px]">
                        (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareCheckIcon className="w-5 h-4" />
                    <span>
                      Mandatory/Forced Leave
                      <span className="text-[8px]">
                        (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Sick Leave{' '}
                      <span className="text-[8px]">
                        (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Maternity Leave{' '}
                      <span className="text-[8px]">
                        (R.A. No. 11210 / IRR issued by CSC, DOLE and SSS)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Paternity Leave{' '}
                      <span className="text-[8px]">
                        (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Special Privilege Leave{' '}
                      <span className="text-[8px]">
                        (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Solo Parent Leave{' '}
                      <span className="text-[8px]">
                        (RA No. 8972 / CSC MC No. 8, s. 2004)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Study Leave{' '}
                      <span className="text-[8px]">
                        (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      10-Day VAWC Leave{' '}
                      <span className="text-[8px]">
                        (RA No. 9262 / CSC MC No. 15, s. 2005)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Rehabilitation Privilege{' '}
                      <span className="text-[8px]">
                        (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No.
                        292)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Special Leave Benefits for Women{' '}
                      <span className="text-[8px]">
                        (RA No. 9710 / CSC MC No. 25, s. 2010)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Special Emergency (Calamity) Leave{' '}
                      <span className="text-[8px]">
                        (CSC MC No. 2, s. 2012, as amended)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Adoption Leave{' '}
                      <span className="text-[8px]">(R.A. No. 8552) </span>
                    </span>
                  </div>
                  <div className="mt-4 italic">Others: </div>
                  <div className="mt-2">
                    ______________________________________
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
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Within the Philippines __________________________
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>Abroad (Specify) _____________________________</span>
                  </div>
                  <div className="italic mt-2">In case of Sick Leave:</div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      In Hospital (Specify Illness) _____________________
                    </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>
                      Out Patient (Specify Illness) ____________________
                    </span>
                  </div>
                  <div className="italic mt-2">
                    In case of Special Leave Benefits for Women:
                  </div>
                  <div>(Specify Illness) ________________________________</div>
                  <div>_______________________________________________</div>
                  <div className="italic mt-2">In case of Study Leave:</div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>Completion of Master's Degree</span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>BAR/Board Examination Review</span>
                  </div>
                  <div className="italic mt-2">Other purpose:</div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>Monetization of Leave Credits</span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>Terminal Leave</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div>6.C NUMBER OF WORKING DAYS APPLIED FOR</div>
                <div className="pl-10 font-bold underline uppercase">1 day</div>
                <div className="pl-10 mt-4">INCLUSIVE DATES</div>
                <div className="pl-10 font-bold underline uppercase">
                  OCTOBER 10, 11, 2024
                </div>
              </td>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div> 6.D COMMUTATION </div>
                <div className="pl-10">
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>Not Requested</span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
                    <span>Requested</span>
                  </div>
                </div>
                <div className="w-full mt-4 flex flex-col items-center justify-center">
                  <div className="font-bold">JOHN DOE</div>
                  <div className="w-2/3 text-center border-t border-black">
                    (Signature of Applicant)
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
                  As of{' '}
                  <span className="font-bold underline">
                    September 30, 2024
                  </span>
                </div>
                <div className="pl-10 mt-1">
                  <table>
                    <thead>
                      <tr>
                        <td className="border px-1 border-black"></td>
                        <td className="border px-1 border-black">
                          Vacation Leave
                        </td>
                        <td className="border px-1 border-black">Sick Leave</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center border px-1 border-black italic">
                          Total Earned
                        </td>
                        <td className="border px-1 border-black"></td>
                        <td className="border px-1 border-black"></td>
                      </tr>
                      <tr>
                        <td className="text-center border px-1 border-black italic">
                          Less this application
                        </td>
                        <td className="border px-1 border-black"></td>
                        <td className="border px-1 border-black"></td>
                      </tr>
                      <tr>
                        <td className="text-center border px-1 border-black italic">
                          Balance
                        </td>
                        <td className="border px-1 border-black"></td>
                        <td className="border px-1 border-black"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="w-full mt-6 flex flex-col items-center justify-center">
                  <div className="font-bold">JOHN DOE</div>
                  <div className="w-2/3 text-center border-t border-black">
                    (Authorized Officer)
                  </div>
                </div>
              </td>
              <td className="align-top border-2 border-black p-1 text-xs">
                <div>7.B RECOMMENDATION</div>
                <div className="pl-10 mt-2">
                  <div className="flex items-start justify-start space-x-1">
                    <SquareIcon className="w-5 h-4" />
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
                <div className="w-full mt-6 flex flex-col items-center justify-center">
                  <div className="font-bold">JOHN DOE</div>
                  <div className="w-2/3 text-center border-t border-black">
                    (Authorized Officer)
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-t-2 border-l-2 border-r-2 border-black">
              <td className="align-top p-1 text-xs">
                <div>7.C APPROVED FOR:</div>
                <div className="pl-10 mt-2">
                  <div>________ days with pay</div>
                  <div>________ days without pay</div>
                  <div>________ others (Specify)</div>
                </div>
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
                <div className="w-full mt-6 flex flex-col items-center justify-center">
                  <div className="font-bold">JOHN DOE</div>
                  <div className="w-1/3 text-center border-t border-black">
                    (Authorized Official)
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
})
