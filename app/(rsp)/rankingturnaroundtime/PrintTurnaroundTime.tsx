import type { RankingTypes } from '@/types'
import type { ResolvedStage } from '@/utils/turnaroundTime'
import { format } from 'date-fns'
import Image from 'next/image'
import * as React from 'react'

interface ComponentToPrintProps {
  ranking: RankingTypes
  stages: ResolvedStage[]
  totalDays: number | null
}

const printDate = (date: Date | null) =>
  date ? format(date, 'MMM d, yyyy') : ''

export const PrintTurnaroundTime = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { ranking, stages, totalDays } = props

  return (
    <div className="invisible">
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
                <div className="mt-4 text-2xl font-bold">
                  RANKING TURNAROUND TIME
                </div>
                <div className="mb-4 text-sm">
                  {ranking.position?.name} - {ranking.type} - {ranking.year}
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center w-8">
                #
              </td>
              <td className="border border-black font-bold text-center">
                Stage
              </td>
              <td className="border border-black font-bold text-center">
                Start
              </td>
              <td className="border border-black font-bold text-center">End</td>
              <td className="border border-black font-bold text-center">
                No. of Days
              </td>
            </tr>
            {stages.map((stage, i) => (
              <tr key={stage.key}>
                <td className="border border-black text-center">{i + 1}</td>
                <td className="border border-black pl-2">{stage.label}</td>
                <td className="border border-black text-center">
                  {printDate(stage.from)}
                </td>
                <td className="border border-black text-center">
                  {printDate(stage.to)}
                </td>
                <td className="border border-black text-center">
                  {stage.days ?? ''}
                </td>
              </tr>
            ))}
            <tr>
              <td
                colSpan={4}
                className="border border-black text-right font-bold pr-4"
              >
                Total Turnaround Time
              </td>
              <td className="border border-black text-center font-bold">
                {totalDays === null ? '' : `${totalDays} day(s)`}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="text-xs pt-2">
                Days are counted inclusively. Stages recorded as a single
                milestone are counted up to the start of the next stage.
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

PrintTurnaroundTime.displayName = 'PrintTurnaroundTime'
