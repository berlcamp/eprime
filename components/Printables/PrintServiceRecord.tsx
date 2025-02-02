import { DocumentTypes } from '@/types'
import { format } from 'date-fns'
import Image from 'next/image'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: DocumentTypes
}

export const PrintServiceRecord = React.forwardRef<
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
                    <Image
                      src="/deped_header.png"
                      alt=""
                      width={200}
                      height={200}
                    />
                    <div className="text-xs">Division of Bayugan City</div>
                  </div>
                </div>
                <hr className="border-black mt-2" />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-center">
                <div className="mt-4 text-2xl mb-4 font-bold tracking-widest">
                  SERVICE RECORD
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="flex items-start justify-start space-x-2">
                  <div className="font-bold">NAME:</div>
                  <table>
                    <thead>
                      <tr className="border-b border-black">
                        <td>{selectedItem.creator.lastname},</td>
                        <td>{selectedItem.creator.firstname}</td>
                        <td>{selectedItem.creator.middlename}</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>(Surname)</td>
                        <td>(Given Name)</td>
                        <td>(M.I)</td>
                      </tr>
                    </tbody>
                  </table>
                  <div>(If married woman, give also maiden name)</div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="mt-2 flex items-start justify-start space-x-2">
                  <div className="font-bold">BIRTH:</div>
                  <table>
                    <thead>
                      <tr className="border-b border-black">
                        <td className="whitespace-nowrap">
                          {selectedItem.print_place_of_birth}
                        </td>
                        <td className="whitespace-nowrap pl-20">
                          {selectedItem.creator.birthday}
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="whitespace-nowrap">(Date of Birth)</td>
                        <td className="whitespace-nowrap pl-20">
                          (Place of Birth)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div>
                    (Data herein should be checked from Birth Baptism
                    certificate or some reliable documents)
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="indent-10 mt-2">
                  This is to Certify that the employee named herein above
                  actually rendered service in the office as shown by the
                  service record below. Each line of which is supported by
                  appointment and other papers actually issued by the office and
                  approved by authorities concerned.
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <table className="w-full mt-2">
                  <tbody>
                    <tr>
                      <td colSpan={2} className="border border-gray-400 px-1">
                        INCLUSIVE DATES
                      </td>
                      <td rowSpan={2} className="border border-gray-400 px-1">
                        DESIGNATION
                      </td>
                      <td rowSpan={2} className="border border-gray-400 px-1">
                        STATUS
                      </td>
                      <td rowSpan={2} className="border border-gray-400 px-1">
                        SALARY
                      </td>
                      <td rowSpan={2} className="border border-gray-400 px-1">
                        STATION/PLACE
                      </td>
                      <td rowSpan={2} className="border border-gray-400 px-1">
                        BRANCH
                      </td>
                      <td rowSpan={2} className="border border-gray-400 px-1">
                        LEAVE OF ABSENCE WITH OUT PAY
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1">FROM</td>
                      <td className="border border-gray-400 px-1">TO</td>
                    </tr>
                    {selectedItem.print_service_records?.map((sr) => (
                      <tr key={sr.id}>
                        <td className="border border-gray-400 px-1">
                          {sr.from}
                        </td>
                        <td className="border border-gray-400 px-1">{sr.to}</td>
                        <td className="border border-gray-400 px-1">
                          {sr.designation}
                        </td>
                        <td className="border border-gray-400 px-1">
                          {sr.status}
                        </td>
                        <td className="border border-gray-400 px-1">
                          {sr.salary}
                        </td>
                        <td className="border border-gray-400 px-1">
                          {sr.station}
                        </td>
                        <td className="border border-gray-400 px-1">
                          {sr.branch}
                        </td>
                        <td className="border border-gray-400 px-1">
                          {sr.days_without_pay}
                        </td>
                      </tr>
                    ))}

                    <tr>
                      <td colSpan={8} className="border border-gray-400 px-1">
                        XXXXXXX
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="mt-2">
                  Issued in compliance with Executive Order No. 54 dated August
                  10, 1954 and in accordance with Circular No. 54 dated August
                  10, 1954 of the System.
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="mt-14 pb-4 flex items-start justify-evenly space-x-1">
                  <div className="text-center">
                    <div className="font-bold">
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
                  <div className="text-center">
                    <div className="font-bold">
                      {selectedItem.approver?.lastname},{' '}
                      {selectedItem.approver?.firstname}{' '}
                      {selectedItem.approver?.middlename}
                    </div>
                    <div>{selectedItem.approver?.hrm_positions?.name}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="border-t-2 border-black flex items-start justify-start space-x-1">
                  <Image
                    src="/deped_bayugan.png"
                    alt=""
                    width={100}
                    height={100}
                  />
                  <div className="mt-3">
                    <div>Lanzones Street, Poblacion, Bayugan City</div>
                    <div className="text-blue-500">deped.bayugan@gmail.com</div>
                    <div>Telephone Number: (085) 303 - 0664</div>
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
