import { RankingExpensesSummaryTypes, SignatoriesTypes } from '@/types'
import Image from 'next/image'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItems: RankingExpensesSummaryTypes[]
  signatories: SignatoriesTypes
}

export const PrintSummary = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItems, signatories } = props

  return (
    <div className="invisible">
      <style>
        {`@media print {
          @page {
            size: landscape;
          }
        }`}
      </style>
      <div ref={ref} className="w-full bg-white py-2 px-1">
        <table className="w-full p-20">
          <tbody>
            <tr>
              <td colSpan={5} className="relative text-center">
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
              <td colSpan={5} className="text-center">
                <div className="mt-4 text-2xl mb-4 font-bold">
                  SUMMARY OF EXPENSES
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center">
                Particulars
              </td>
              <td className="border border-black font-bold text-center">
                No. of Applicants
              </td>
              <td className="border border-black font-bold text-center">
                Unit Cost or Hourly Rate
              </td>
              <td className="border border-black font-bold text-center">
                Time Spent (per applicant in hours)
              </td>
              <td className="border border-black font-bold text-center">
                Amount
              </td>
            </tr>
            {selectedItems.map((item, i) => (
              <tr key={i}>
                <td className="border border-black pl-4">{item.particulars}</td>
                <td className="border border-black text-center">
                  {item.total_applicants}
                </td>
                <td className="border border-black text-center">
                  {item.unit_cost}
                </td>
                <td className="border border-black text-center">
                  {item.time_spent_per_applicant}
                </td>
                <td className="border border-black text-center">
                  {Number(item.amount) !== 0 ? item.amount : ''}
                </td>
              </tr>
            ))}
            {/* Last row for total amount */}
            <tr>
              <td
                colSpan={4}
                className="border border-black text-right font-bold pr-4"
              >
                Total Amount
              </td>
              <td className="border border-black text-center font-bold">
                {selectedItems
                  .reduce((total, item) => total + Number(item.amount), 0)
                  .toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="text-xs">
                <div className="mt-5">
                  <div>Prepared By,</div>
                  <div className="mt-5 font-bold">
                    {signatories.prepared_by}
                  </div>
                  <div>{signatories.prepared_by_position}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="text-xs text-right">
                <div>Approved by:</div>
                <div className="mt-5 font-bold">{signatories.approval}</div>
                <div>{signatories.approval_position}</div>
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
