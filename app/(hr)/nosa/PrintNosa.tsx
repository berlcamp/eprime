/* eslint-disable @next/next/no-img-element */
import { NosaTypes, SignatoriesTypes } from '@/types'
import { formatToPesos } from '@/utils/text-helper'
import { format } from 'date-fns'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: NosaTypes
  signatories: SignatoriesTypes
}

export const PrintNosa = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem, signatories } = props

  return (
    <div className="invisible">
      <div ref={ref} className="w-[816px] bg-white py-2 px-1">
        <table className="w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="relative text-center">
                <div className="flex items-center justify-center">
                  <div className="">
                    <img
                      src="/deped_header.png"
                      alt=""
                      width={200}
                      height={200}
                    />
                  </div>
                </div>
                <div className="text-xs">
                  SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
                </div>
                <hr className="border-black mt-2" />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-center">
                <div className="mt-4 text-2xl mb-4 font-bold">
                  Notice of Salary Adjustment
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="text-right mt-10">
                  {format(new Date(), 'MMMM dd, yyyy')}
                </div>
                <div className="mt-10">
                  <div className="font-bold uppercase">
                    {selectedItem.hrm_user?.lastname},{' '}
                    {selectedItem.hrm_user?.firstname}{' '}
                    {selectedItem.hrm_user?.middlename}
                  </div>
                  <div className="hrm_user">
                    {selectedItem.hrm_user?.hrm_positions?.name}
                  </div>
                  <div className="uppercase">
                    {selectedItem.hrm_user?.hrm_schools?.name}{' '}
                    {selectedItem.hrm_user?.hrm_offices?.name}
                  </div>
                </div>

                <div className="mt-10">Sir/Ma'am:</div>

                <div className="indent-10 mt-10">
                  Pursuant to National Budget Circular No.{' '}
                  <span className="underline">594</span> dated{' '}
                  <span className="underline">12 August 2024</span>,
                  implementing Executive Order No. 64, s. 2024 dated August 2,
                  2024, your salary is hereby adjusted effective,{' '}
                  <span className="font-bold underline">
                    {format(
                      new Date(selectedItem.effective_date),
                      'MMMM dd, yyyy'
                    )}
                  </span>
                  , as follows:
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <table className="w-full mt-10 mx-8">
                  <tbody>
                    <tr>
                      <td className="px-1 py-1">
                        <div>
                          1. Adjusted monthly basic salary effective{' '}
                          <span className="font-bold">
                            {format(
                              new Date(selectedItem.effective_date),
                              'MMMM dd, yyyy'
                            )}
                          </span>
                          ,
                        </div>
                        <div>
                          under the new Salary Schedule; (SG{' '}
                          <span className="font-bold underline">
                            {selectedItem.new_grade}
                          </span>
                          , step <span className="font-bold underline">1</span>)
                        </div>
                      </td>
                      <td className="px-1">
                        {formatToPesos(Number(selectedItem.new_amount))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-1 py-1">
                        <div>
                          2. Actual monthly basic salary as of
                          <span className="font-bold">
                            {format(
                              new Date(selectedItem.as_of_date),
                              'MMMM dd, yyyy'
                            )}
                          </span>
                          ;
                        </div>
                        <div>
                          SG{' '}
                          <span className="font-bold underline">
                            {selectedItem.previous_grade}
                          </span>
                          Step{' '}
                          <span className="font-bold underline">
                            {selectedItem.previous_step}
                          </span>
                        </div>
                      </td>
                      <td className="px-1">
                        {formatToPesos(Number(selectedItem.previous_amount))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-1 py-1">
                        <div>
                          3. Monthly salary adjustment effective
                          <span className="font-bold">
                            {format(
                              new Date(selectedItem.effective_date),
                              'MMMM dd, yyyy'
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-1">
                        <div className="underline underline-offset-2">
                          {formatToPesos(
                            Number(selectedItem.new_amount) -
                              Number(selectedItem.previous_amount)
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="indent-10 mt-10">
                  It is understood that this salary adjustment is subject to
                  review and post-audit, and to appropriate re-adjustment and
                  refund if found not in order.
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="mt-14 pb-4 flex items-start justify-evenly space-x-1">
                  <div className="text-center">
                    <div className="font-bold w-32">&nbsp;</div>
                  </div>
                  <div className="text-center">
                    <div>Very truly yours,</div>
                    <div className="mt-10 font-bold">
                      {signatories.truly_yours}
                    </div>
                    <div>{signatories.truly_yours_position}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs text-center">
                <div>Recommending Approval:</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="pb-4 flex items-start justify-evenly space-x-1">
                  <div className="text-center">
                    <div className="mt-10 font-bold">
                      {signatories.recommending_1}
                    </div>
                    <div>{signatories.recommending_1_position}</div>
                  </div>
                  <div className="text-center">
                    <div className="mt-10 font-bold">
                      {signatories.recommending_2}
                    </div>
                    <div>{signatories.recommending_2_position}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs text-center">
                <div>Approved by:</div>
                <div className="mt-10 font-bold">{signatories.approval}</div>
                <div>{signatories.approval_position}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="mt-4">
                  Position Title: {selectedItem.hrm_user?.hrm_positions?.name}
                </div>
                <div>Salary Grade: {selectedItem.new_grade}</div>
                <div>
                  Item No./Unique No., FY 2023 personal Services Itemization
                </div>
                <div>
                  And/or Plantilla of Personnel:{' '}
                  {selectedItem.hrm_user?.hrm_item?.item_number}
                </div>
                <div>Copy Furnished: GSIS, DPSU</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="absolute bottom-0 w-full text-xs">
          <div className="border-t-2 border-black flex items-start justify-start space-x-1">
            <img src="/deped_bayugan.png" alt="" width={100} height={100} />
            <div className="mt-3">
              <div>Lanzones Street, Poblacion, Bayugan City</div>
              <div className="text-blue-500">deped.bayugan@gmail.com</div>
              <div>Telephone Number: (085) 303 - 0664</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
