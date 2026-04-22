import { DocumentTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: DocumentTypes
}

export const PrintServiceRecord = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>(({ selectedItem }, ref) => {
  // Split service records into chunks of 20
  const recordBatches = selectedItem.print_service_records
    ? selectedItem.print_service_records.reduce(
        (
          acc: Array<typeof selectedItem.print_service_records>,
          _,
          index,
          array
        ) => {
          if (index % 12 === 0) acc.push(array.slice(index, index + 12))
          return acc
        },
        []
      )
    : []

  const total = recordBatches.length

  return (
    <div className="invisible">
      <div ref={ref}>
        {recordBatches.map((batch, pageIndex) => (
          <div
            key={pageIndex}
            className={`w-[816px] bg-white py-2 px-1 ${
              pageIndex > 0 ? 'print-page' : 'print-page'
            }`}
          >
            {/* Ensures the batch starts on a new page */}
            <div className="print-break"></div>{' '}
            <table className="w-full">
              <tbody>
                {/* Header Section */}
                <tr>
                  <td colSpan={2} className="relative text-center">
                    <div className="flex items-center justify-center">
                      <div>
                        <img
                          src="/deped_header.png"
                          alt="DepEd Header"
                          width={150}
                          height={150}
                        />
                        <div className="text-xs">Division of Bayugan City</div>
                      </div>
                    </div>
                    <hr className="border-black mt-2" />
                  </td>
                </tr>

                {/* Title Section */}
                <tr>
                  <td colSpan={2} className="text-center">
                    <div className="mt-4 text-2xl mb-4 font-bold tracking-widest">
                      SERVICE RECORD
                    </div>
                  </td>
                </tr>

                {/* Employee Name Section */}
                <tr>
                  <td colSpan={2} className="text-xs">
                    <div className="flex items-start space-x-2">
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

                {/* Birth Section */}
                <tr>
                  <td colSpan={2} className="text-xs">
                    <div className="mt-2 flex items-start space-x-2">
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
                            <td className="whitespace-nowrap">
                              (Date of Birth)
                            </td>
                            <td className="whitespace-nowrap pl-20">
                              (Place of Birth)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div>
                        (Data herein should be checked from Birth/Baptism
                        certificate or other reliable documents)
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Certification Section */}
                <tr>
                  <td colSpan={2} className="text-xs">
                    <div className="indent-10 mt-2">
                      This is to certify that the employee named herein has
                      rendered service in the office as shown in the record
                      below. Each line is supported by appointments and other
                      documents approved by the appropriate authorities.
                    </div>
                  </td>
                </tr>

                {/* Service Record Table */}
                <tr>
                  <td colSpan={2} className="text-xs">
                    <table className="w-full mt-2 border-collapse">
                      <tbody>
                        {/* Table Header */}
                        <tr className="bg-gray-200">
                          <td
                            colSpan={2}
                            className="border border-gray-400 px-1"
                          >
                            INCLUSIVE DATES
                          </td>
                          <td
                            rowSpan={2}
                            className="border border-gray-400 px-1"
                          >
                            DESIGNATION
                          </td>
                          <td
                            rowSpan={2}
                            className="border border-gray-400 px-1"
                          >
                            STATUS
                          </td>
                          <td
                            rowSpan={2}
                            className="border border-gray-400 px-1"
                          >
                            SALARY
                          </td>
                          <td
                            rowSpan={2}
                            className="border border-gray-400 px-1"
                          >
                            STATION/PLACE
                          </td>
                          <td
                            rowSpan={2}
                            className="border border-gray-400 px-1"
                          >
                            BRANCH
                          </td>
                          <td
                            rowSpan={2}
                            className="border border-gray-400 px-1"
                          >
                            LEAVE OF ABSENCE WITHOUT PAY
                          </td>
                        </tr>
                        <tr className="bg-gray-200">
                          <td className="border border-gray-400 px-1">FROM</td>
                          <td className="border border-gray-400 px-1">TO</td>
                        </tr>

                        {/* Service Record Rows */}
                        {batch.map((sr) => (
                          <tr key={sr.id}>
                            <td className="border border-gray-400 px-1">
                              {sr.from}
                            </td>
                            <td className="border border-gray-400 px-1">
                              {sr.to}
                            </td>
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

                        {/* Placeholder Row */}
                        <tr>
                          <td
                            colSpan={8}
                            className="border border-gray-400 px-1"
                          >
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
                      Issued in compliance with Executive Order No. 54 dated
                      August 10, 1954 and in accordance with Circular No. 54
                      dated August 10, 1954 of the System.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-xs">
                    <div className="mt-8 pb-2 flex items-start justify-evenly space-x-1">
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
                    {/* Page footer — sits in the normal flow below the
                        Date/Approver row (no fixed positioning, otherwise the
                        row above collapses into the footer on print). */}
                    <div className="mt-3 page-footer-block">
                      <div className="border-t-2 border-black flex items-start justify-start space-x-2 pt-1">
                        <img
                          src="/deped_bayugan.png"
                          alt=""
                          width={55}
                          height={55}
                        />
                        <div className="mt-1 leading-tight">
                          <div>Lanzones Street, Poblacion, Bayugan City</div>
                          <div className="text-blue-500">
                            deped.bayugan@gmail.com
                          </div>
                          <div>Telephone Number: (085) 303 - 0664</div>
                          <div className="italic text-gray-500">
                            (This is a system generated form)
                          </div>
                        </div>
                      </div>
                      <div className="text-center mt-1">
                        Page {pageIndex + 1} of {total}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
})
