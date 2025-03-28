import { DocumentTypes } from '@/types'
import { format } from 'date-fns'
import { SquareCheckIcon, SquareIcon } from 'lucide-react'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: DocumentTypes
}

export const PrintTravelForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

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
                    <div className="text-xs">
                      SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <table className="border border-black mt-2 w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="text-center">
                <div className="mt-2 text-xl mb-4 font-bold tracking-widest underline">
                  AUTHORITY TO TRAVEL
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs border-b border-black px-1">
                <div className="w-full relative font-bold">
                  <div>REGION: Caraga - Region XIII</div>
                  <div>BUREAU/DIVISION/SCHOOL: Division of Bayugan City</div>
                  <div className="absolute top-0 right-0 pr-10">
                    Control No.:
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                Date of Filing
              </td>
              <td className="text-center text-xs border border-black px-1">
                {format(new Date(selectedItem.created_at), 'MMMM d, yyyy')}
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                NAME/S
              </td>
              <td className="text-center text-xs border border-black px-1">
                <div>
                  {selectedItem.creator.lastname},{' '}
                  {selectedItem.creator.firstname}{' '}
                  {selectedItem.creator.middlename}
                </div>
                <div className="w-full">
                  Accompanied by: {selectedItem.travel_with}
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                Position/Designation
              </td>
              <td className="text-center text-xs border border-black px-1">
                <div>{selectedItem.creator.hrm_positions?.name}</div>
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                Current Station
              </td>
              <td className="text-center text-xs border border-black px-1">
                <div>
                  {selectedItem.creator.hrm_schools?.name}{' '}
                  {selectedItem.creator.hrm_offices?.name}
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                Purpose of Travel
              </td>
              <td className="text-center text-xs border border-black px-1">
                <div>{selectedItem.travel_purpose}</div>
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                Activity Organized / Sponsored By
              </td>
              <td className="text-center text-xs border border-black px-1">
                {selectedItem.travel_host}
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                <div>Period Covered</div>
                <div className="font-light italic">
                  (Inclusive of Travel Time)
                </div>
              </td>
              <td className="text-center text-xs border border-black px-1">
                <div>
                  {format(new Date(selectedItem.travel_from), 'MMMM d, yyyy')}
                  {' to '}{' '}
                  {format(new Date(selectedItem.travel_to), 'MMMM d, yyyy')}
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                <div>Please Check</div>
              </td>
              <td className="text-center text-xs border border-black px-1">
                <div className="flex items-start justify-center space-x-1">
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.travel_type === 'Official Travel' ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-5 h-4" />
                    )}
                    <span>Official </span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.travel_type === 'Personal Travel' ? (
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
              <td className="text-xs border border-black px-1 font-bold">
                Venue / Distination
              </td>
              <td className="text-center text-xs border border-black px-1">
                {selectedItem.travel_destination}
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                Expenses Covered
              </td>
              <td className="text-center text-xs border border-black px-1">
                TRAVEL EXPENSES
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1 font-bold">
                Fund Source (Pap Code/...)
              </td>
              <td className="text-center text-xs border border-black px-1">
                {selectedItem.travel_fund_source}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs px-1">
                <div className="italic mt-2">
                  I hereby attest that the information in this form and in the
                  supporting documents attached hereto are true and correct.
                </div>
                <div className="mt-10 pb-4 flex items-start justify-evenly space-x-1">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      {selectedItem.creator?.signature_path ? (
                        <img
                          src={selectedItem.creator?.signature_path}
                          alt=""
                          width={75}
                          height={75}
                        />
                      ) : (
                        <span>SGD</span>
                      )}
                    </div>
                    <div className="font-bold border-t border-t-black">
                      {selectedItem.creator.lastname},{' '}
                      {selectedItem.creator.firstname}{' '}
                      {selectedItem.creator.middlename}
                    </div>
                    <div>Name and Signature of Requesting Employee</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold underline">
                      {format(
                        new Date(selectedItem.created_at),
                        'MMMM d, yyyy'
                      )}
                    </div>
                    <div>Date</div>
                  </div>
                </div>
                <div className="italic mt-2">
                  This is to certify that the trip of the requesting employee
                  satisfies all the minmum conditions for authorized official
                  travel and that alternatives to travel insufficient for the
                  purpose stated herein.
                </div>
                <div className="mt-10 pb-4 flex items-center justify-evenly space-x-1">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      {selectedItem.recommender?.signature_path ? (
                        <img
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
                  </div>
                  <div className="text-center">
                    <div className="font-bold underline">
                      {selectedItem.date_recommended
                        ? format(
                            new Date(selectedItem.date_recommended),
                            'MMMM d, yyyy'
                          )
                        : format(
                            new Date(selectedItem.created_at),
                            'MMMM d, yyyy'
                          )}
                    </div>
                    <div>Date</div>
                  </div>
                </div>
                <div className="font-bold mt-2">Approved:</div>
                <div className="mt-6 pb-4 flex items-center justify-evenly space-x-1">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      {selectedItem.approver?.signature_path ? (
                        <img
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
                  <div className="text-center">
                    <div className="font-bold underline">
                      {selectedItem.date_approved
                        ? format(
                            new Date(selectedItem.date_approved),
                            'MMMM d, yyyy'
                          )
                        : format(
                            new Date(selectedItem.created_at),
                            'MMMM d, yyyy'
                          )}
                    </div>
                    <div>Date</div>
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
