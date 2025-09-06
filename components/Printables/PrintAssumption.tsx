/* eslint-disable @next/next/no-img-element */
import { ApplicantTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes
}

export const PrintAssumption = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

  if (!selectedItem?.date) {
    return null // or fallback UI
  }

  const targetDate = new Date(selectedItem.date)
  const formattedDate = format(targetDate, "do 'day of' MMMM, yyyy")

  return (
    <div className="invisible">
      <div ref={ref} className="w-[816px] bg-white py-2 px-8">
        <table className="w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="relative text-center">
                <div className="flex flex-col items-center justify-center">
                  <img src="/deped_header.png" alt="DepEd Logo" width={200} />
                  <div className="">
                    SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <table className="border-t-2 border-black mt-2 w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="text-center">
                <div className="mt-2 pt-10 font-bold text-xl">
                  CERTIFICATION OF ASSUMPTION TO DUTY
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-1">
                <div className="space-y-4">
                  <div className="indent-8 mt-8">
                    <p className="text-justify [text-align-last:justify]">
                      This is to certify that Ms./Mr.
                      <span className="font-bold underline underline-offset-2">
                        {selectedItem.firstname} {selectedItem.middlename}{' '}
                        {selectedItem.lastname}
                      </span>{' '}
                      has
                    </p>
                  </div>
                  <p className="text-justify [text-align-last:justify]">
                    assumed the duties and responsibilities as
                  </p>
                  <p className="text-justify">
                    <span className="font-bold underline underline-offset-2">
                      {selectedItem.ranking?.position?.name}
                    </span>{' '}
                    of{' '}
                    <span className="font-bold">{selectedItem.assignment}</span>
                    <span className="underline underline-offset-2">
                      effective {selectedItem.date}.
                    </span>
                  </p>
                  <div className="indent-8 mt-8">
                    <p className="text-justify [text-align-last:justify]">
                      This certification is issued in connection with the
                      issuance of the
                    </p>
                    <p className="text-justify [text-align-last:justify]">
                      appointment of Ms./Mr.
                      <span className="font-bold underline underline-offset-2">
                        {selectedItem.firstname} {selectedItem.middlename}{' '}
                        {selectedItem.lastname}
                      </span>{' '}
                      as{' '}
                      <span className="font-bold underline underline-offset-2">
                        {selectedItem.ranking?.position?.name}
                      </span>
                    </p>
                  </div>
                  <div className="indent-8 mt-8">
                    <p className="text-justify [text-align-last:justify]">
                      Done this {formattedDate} in DepEd Bayugan City Division
                      Office.
                    </p>
                  </div>
                </div>
                <div className="mt-10 px-8 pb-4 flex items-start justify-between space-x-1">
                  <div className="text-center">&nbsp;</div>
                  <div className="text-center">
                    <div className="font-bold underline underline-offset-2">
                      {selectedItem.signatory}
                    </div>
                    <div>{selectedItem.position}</div>
                  </div>
                </div>
                <div className="mt-4">
                  Date:{' '}
                  {selectedItem.date &&
                    format(new Date(selectedItem.date), 'MMMM d, yyyy')}
                </div>
                <div className="mt-10">Attested by:</div>
                <div className="mt-6 px-8 pb-4 flex items-start justify-between space-x-1">
                  <div className="text-center">
                    <div className="font-bold underline underline-offset-2">
                      JASMINE B. NEPA
                    </div>
                    <div> Administrative Officer IV - HRMO </div>
                  </div>
                  <div className="text-center">&nbsp;</div>
                </div>

                <div className="text-sm mt-10">
                  201 file
                  <br /> Admin
                  <br /> COA
                  <br /> CSC
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs">
                <div className="mt-8 border-t-2 border-black flex items-start justify-start space-x-1 py-2">
                  <img src="/logos/matatag.png" width={60} alt="Logo 1" />
                  <img src="/logos/bagong.png" width={60} alt="Logo 2" />
                  <img src="/logos/bayugan.png" width={60} alt="Logo 3" />
                  <div className="">
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
