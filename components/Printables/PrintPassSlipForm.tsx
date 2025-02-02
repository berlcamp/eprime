import { DocumentTypes } from '@/types'
import { format } from 'date-fns'
import { SquareCheckIcon, SquareIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: DocumentTypes
}

export const PrintPassSlipForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

  return (
    <div className="invisible">
      <div ref={ref} className="w-[408px] bg-white py-2 px-4">
        <div className="w-full p-2">
          <table className="border border-black">
            <thead>
              <tr>
                <td colSpan={2} className="relative text-center">
                  <div className="flex items-center justify-center">
                    <div className="">
                      <div className="text-xs">Republic of the Philippines</div>
                      <div className="uppercase text-xs">
                        Department of Education
                      </div>
                      <div className="text-xs">
                        Caraga Administrative Region
                      </div>
                      <div className="text-xs">Division of Bayugan City</div>
                      <div className="text-xs">
                        Lanzones St., Poblacion, Bayugan City
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} className="text-center">
                  <div className="mt-2 font-bold underline">PASS SLIP</div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="text-xs">
                  <div className="flex items-center justify-end">
                    <div className="text-center">
                      <div className="underline underline-offset-2">
                        {format(new Date(), 'MMMM d, yyyy')}
                      </div>
                      <div>Date</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="text-xs">
                  <div className="text-xs uppercase underline underline-offset-2">
                    {selectedItem.creator.lastname},{' '}
                    {selectedItem.creator.firstname}{' '}
                    {selectedItem.creator.middlename}
                  </div>
                  <div>(Printed Name & Signature of employee)</div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="text-xs">
                  <div className="mt-2">Request Permission to:</div>
                  <div className="mt-2 flex items-center justify-start space-x-1">
                    {selectedItem.pass_slip_type ===
                    'Leave the office premises during office hours' ? (
                      <SquareCheckIcon className="w-6 h-6" />
                    ) : (
                      <SquareIcon className="w-6 h-6" />
                    )}
                    <span>
                      Leave the office premises during office hourse from:
                    </span>
                  </div>
                  <div className="pl-10">
                    Intended time of departure:{' '}
                    {selectedItem.pass_slip_type ===
                      'Leave the office premises during office hours' && (
                      <span>
                        {selectedItem.pass_slip_intended_time_departure}
                      </span>
                    )}
                  </div>
                  <div className="pl-10">
                    Intended time of arrival:{' '}
                    {selectedItem.pass_slip_type ===
                      'Leave the office premises during office hours' && (
                      <span>
                        {selectedItem.pass_slip_intended_time_arrival}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-start space-x-1">
                    {selectedItem.pass_slip_type ===
                    'Deviate from my fixed time of arrival (Fixed Time)' ? (
                      <SquareCheckIcon className="w-6 h-6" />
                    ) : (
                      <SquareIcon className="w-6 h-6" />
                    )}
                    <span>
                      Deviate from my fixed time of arrival (fixed time)
                    </span>
                  </div>
                  {/* <hr className="mt-2 border-black" /> */}
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="text-xs">
                  <div className="pl-10 text-xs font-bold">Destination</div>
                </td>
              </tr>
              <tr>
                <td className="text-xs">
                  <div className="pl-10">
                    From:{' '}
                    <span className="underline">
                      {selectedItem.pass_slip_fixed_time_from}
                    </span>
                  </div>
                </td>
                <td className="text-xs">
                  <div className="mb-2">
                    To:{' '}
                    <span className="underline">
                      {selectedItem.pass_slip_fixed_time_to}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="text-xs">
                  <div className="pl-10">Purpose:</div>
                </td>
                <td className="text-xs">
                  <div className="flex items-start space-x-1">
                    <div className="flex items-start justify-start space-x-1">
                      {selectedItem.pass_slip_purpose === 'Official' ? (
                        <SquareCheckIcon className="w-5 h-4" />
                      ) : (
                        <SquareIcon className="w-5 h-4" />
                      )}
                      <span>Official </span>
                    </div>
                    <div className="flex items-start justify-start space-x-1">
                      {selectedItem.pass_slip_purpose === 'Personal' ? (
                        <SquareCheckIcon className="w-5 h-4" />
                      ) : (
                        <SquareIcon className="w-5 h-4" />
                      )}
                      <span>Personal</span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="text-xs">
                  <div className="mt-2">
                    Reasons:{' '}
                    <span className="underline">
                      {selectedItem.pass_slip_reason}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="text-xs">
                  <hr className="mt-2 border-black" />
                  <div className="mt-1">Noted by:</div>
                  <div className="text-center w-1/2">
                    <div className="flex items-center justify-center">
                      {selectedItem.recommender?.signature_path ? (
                        <Image
                          src={selectedItem.recommender?.signature_path}
                          alt=""
                          width={75}
                          height={75}
                        />
                      ) : (
                        <span>SGD</span>
                      )}
                    </div>
                    <div className="font-bold border-t border-t-black">
                      {selectedItem.recommender?.lastname},{' '}
                      {selectedItem.recommender?.firstname}{' '}
                      {selectedItem.recommender?.middlename}
                    </div>
                    <div>Immediate Supervisor</div>
                  </div>
                  <div className="mt-1">Approve by:</div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      {selectedItem.approver?.signature_path ? (
                        <Image
                          src={selectedItem.approver?.signature_path}
                          alt=""
                          width={75}
                          height={75}
                        />
                      ) : (
                        <span>SGD</span>
                      )}
                    </div>
                    <div className="font-bold border-t border-t-black">
                      {selectedItem.approver?.lastname},{' '}
                      {selectedItem.approver?.firstname}{' '}
                      {selectedItem.approver?.middlename}
                    </div>
                    <div>OIC / Schools Division Superintendent</div>
                  </div>
                  <div className="mt-3">Actual Time of Departure:</div>
                  <div className="">Actual Time of Arrival:</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})
