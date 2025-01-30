import { DocumentTypes } from '@/types'
import { SquareCheckIcon, SquareIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: DocumentTypes
}

export const PrintLocatorSlipForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

  return (
    <div className="invisible">
      <div ref={ref} className="w-[816px] bg-white py-2 px-1">
        <table className="w-full">
          <thead>
            <tr>
              <td colSpan={2} className="relative text-center">
                <div className="flex items-center justify-center">
                  <div className="">
                    <div className="text-xs">Republic of the Philippines</div>
                    <div className="">Department of Education</div>
                    <div className="text-xs">Division of Bayugan City</div>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} className="text-center">
                <div className="mt-4 mb-4 font-bold underline">
                  LOCATOR SLIP
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-xs font-bold border border-black px-1">
                NAME
              </td>
              <td className="text-xs border border-black px-1 text-center uppercase">
                {selectedItem.creator.lastname},{' '}
                {selectedItem.creator.firstname}{' '}
                {selectedItem.creator.middlename}
              </td>
            </tr>
            <tr>
              <td className="text-xs font-bold border border-black px-1">
                Position/Designation
              </td>
              <td className="text-xs border border-black px-1 text-center">
                {selectedItem.creator.hrm_positions?.name}
              </td>
            </tr>
            <tr>
              <td className="text-xs font-bold border border-black px-1">
                Permanent Station
              </td>
              <td className="text-xs border border-black px-1 text-center">
                {selectedItem.creator.hrm_offices?.name}
              </td>
            </tr>
            <tr>
              <td className="text-xs border border-black px-1">
                <div className="font-bold ">Purpose of Travel</div>
                <div className="text-[8px] italic">
                  (must be supported by attachments)
                </div>
              </td>
              <td className="text-xs border border-black px-1 text-center">
                {selectedItem.locator_slip_purpose}
              </td>
            </tr>
            <tr>
              <td className="text-xs font-bold border border-black px-1">
                Please check
              </td>
              <td className="text-xs border border-black px-1">
                <div className="flex items-start justify-evenly space-x-1">
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.locator_slip_type === 'Official Business' ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-6 h-6" />
                    )}
                    <span>Official Business</span>
                  </div>
                  <div className="flex items-start justify-start space-x-1">
                    {selectedItem.locator_slip_type === 'Official Time' ? (
                      <SquareCheckIcon className="w-5 h-4" />
                    ) : (
                      <SquareIcon className="w-6 h-6" />
                    )}
                    <span>Official Time</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-xs font-bold border border-black px-1">
                Date and Time
              </td>
              <td className="text-xs border border-black px-1 text-center">
                {selectedItem.locator_slip_date} -{' '}
                {selectedItem.locator_slip_time}
              </td>
            </tr>
            <tr>
              <td className="text-xs font-bold border border-black px-1">
                Destination{' '}
              </td>
              <td className="text-xs border border-black px-1 text-center">
                {selectedItem.locator_slip_destination}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs border border-black px-1">
                <div className="mt-14 pb-4 flex items-start justify-evenly space-x-1">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      {selectedItem.creator?.signature_path ? (
                        <Image
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
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs border border-black px-1">
                <div className="mt-4 text-center font-bold underline">
                  CERTIFICATION
                </div>
                <div className="mt-2">To the concerned:</div>
                <div className="mt-2">
                  This is to certify that the above-named DepEd
                  official/personnel has visited or appeared in this
                  Office/place for the purpose and during the date and time
                  stated above.
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <div>
                    <div>Name and Signature:</div>
                    <div>Position/Designation:</div>
                    <div>Office:</div>
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
