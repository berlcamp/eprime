import { NosiTypes, SignatoriesTypes } from '@/types'
import { formatToPesos } from '@/utils/text-helper'
import { format } from 'date-fns'
import Image from 'next/image'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: NosiTypes
  signatories: SignatoriesTypes
}

export const PrintNosi = React.forwardRef<
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
                    <Image
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
                  Date: {format(new Date(), 'MMMM dd, yyyy')}
                </div>
                <div className="mt-10">
                  <div className="font-bold uppercase">
                    {selectedItem.hrm_user.lastname},{' '}
                    {selectedItem.hrm_user.firstname}{' '}
                    {selectedItem.hrm_user.middlename}
                  </div>
                  <div className="uppercase">
                    {selectedItem.hrm_user.hrm_schools?.name}{' '}
                    {selectedItem.hrm_user.hrm_offices?.name}
                  </div>
                </div>

                <div className="mt-10">Dear Sir/Ma'am:</div>

                <div className="indent-10 mt-10">
                  Pursuant to Civil Service Commision and Department of Budget
                  and Management and Management Joint Circular No. 1, s.2012,
                  dated September 3, 2012 implementing item (4) (d) of the
                  Senate of the House of Representatives Joint Resolution No. 4,
                  s. 2009, approved on June 17, 2009, your salary as{' '}
                  {selectedItem.hrm_user.hrm_positions?.name} is hereby adjusted
                  effective{' '}
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
                      <td className="px-1">
                        <div>
                          1. Actual Basic Salary as of{' '}
                          <span className="font-bold">
                            {format(
                              new Date(selectedItem.as_of_date),
                              'MMMM dd, yyyy'
                            )}
                          </span>
                        </div>
                        <div>
                          (SG{' '}
                          <span className="font-bold underline">
                            {selectedItem.previous_grade}
                          </span>
                          , step{' '}
                          <span className="font-bold underline">
                            {selectedItem.previous_step}
                          </span>
                          )
                        </div>
                      </td>
                      <td className="px-1">
                        {formatToPesos(Number(selectedItem.previous_amount))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-1">
                        <div className="mt-4">
                          2. Add:{' '}
                          {Number(selectedItem.new_step) -
                            Number(selectedItem.previous_step)}{' '}
                          Step Increment
                        </div>
                        <div>Due to length of Service</div>
                      </td>
                      <td className="px-1">
                        {formatToPesos(
                          Number(selectedItem.new_amount) -
                            Number(selectedItem.previous_amount)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-1">
                        <div className="mt-4">
                          3. Adjusted month basic salary Effective{' '}
                          <span className="font-bold">
                            {format(
                              new Date(selectedItem.effective_date),
                              'MMMM dd, yyyy'
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-1">
                        <div className="mt-4 underline underline-offset-2">
                          {formatToPesos(Number(selectedItem.new_amount))}
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
                  The salary adjustment is subject to review and post-audit, and
                  to appropriate re-adjustment and refund if found not in order.
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
                  Item No./Unique No., FY 2023 personal Services Itemization
                </div>
                <div>
                  And/or Plantilla of Personnel:{' '}
                  {selectedItem.hrm_user.hrm_item?.item_number}
                </div>
                <div>Copy Furnished: GSIS, DPSU</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="absolute bottom-0 w-full text-xs">
          <div className="border-t-2 border-black flex items-start justify-start space-x-1">
            <Image src="/deped_bayugan.png" alt="" width={100} height={100} />
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
