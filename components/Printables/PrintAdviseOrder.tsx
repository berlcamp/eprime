/* eslint-disable @next/next/no-img-element */
import { ApplicantTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes
}

export const PrintAdviseOrder = React.forwardRef<
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
              <td colSpan={2} className="">
                <div className="mt-2 mb-4 font-bold">
                  Office of the Schools Division Superintendent
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="">
                <div className="mt-2 mb-4 font-bold">MEMORANDUM</div>
              </td>
            </tr>
            <tr>
              <td className="py-2">To</td>
              <td className="font-bold">
                : {selectedItem.firstname} {selectedItem.middlename}{' '}
                {selectedItem.lastname}
              </td>
            </tr>
            <tr>
              <td className="py-2 align-top pt-6">From</td>
              <td className="font-bold pt-6">
                <div>: MA. TERESA M. REAL</div>
                <div className="font-normal pl-2">
                  OIC-Schools Division Superintendent
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-2">Date</td>
              <td className="">
                :{' '}
                {selectedItem.date &&
                  format(new Date(selectedItem.date), 'MMMM d, yyyy')}
              </td>
            </tr>
            <tr>
              <td className="py-2">Subject</td>
              <td className="font-bold">: ADVICE ORDER</td>
            </tr>
            <tr className="border-t-2 border-black">
              <td colSpan={2} className=""></td>
            </tr>
            <tr>
              <td colSpan={2} className="px-1">
                <div className="indent-8 mt-8">
                  You are hereby advised of your item as{' '}
                  <span className="font-bold">
                    {selectedItem.ranking?.position?.name} of{' '}
                    {selectedItem.assignment}
                  </span>{' '}
                  effective immediately.
                </div>
                <div className="indent-8 mt-4">
                  As such you are to perform duties and responsibilities
                  concomitant to your assignment.
                </div>
                <div className="indent-8 mt-4">
                  You are further advised to report immediately to the School
                  Head for specific instructions.
                </div>
                <div className="indent-8 mt-4">
                  Please be guided accordingly.
                </div>

                <div className="mt-10 px-8 pb-4 flex items-start justify-between space-x-1">
                  <div className="text-center">&nbsp;</div>
                  <div className="text-center">
                    <div>Conforme:</div>
                    <div className="font-bold mt-8">
                      ________________________________
                    </div>
                    <div>Name & Signature</div>
                    <div className="font-bold mt-4">
                      ________________________________
                    </div>
                    <div>Date</div>
                  </div>
                </div>
                <div className="text-sm">
                  CC: School Head
                  <br /> District In-Charge
                  <br /> Division Planning Officer
                  <br /> File copy
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
