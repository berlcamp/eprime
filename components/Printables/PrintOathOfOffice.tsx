/* eslint-disable @next/next/no-img-element */
import { ApplicantTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

// DepEd official logos
const DEPED_LOGOS = {
  logo1: '/logos/deped_logo_1.png',
  logo2: '/logos/deped_logo_2.png',
}

const LogoImg = ({
  src,
  alt,
  width,
  ...props
}: {
  src: string
  alt: string
  width: number
  [key: string]: unknown
}) => {
  return <img src={src} alt={alt} width={width} {...props} />
}

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes
}

/**
 * CS Form No. 32: Oath of Office
 * CSC standard format for Philippine government employees
 */
export const PrintOathOfOffice = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    'N/A'
  const fullName = `${selectedItem.firstname} ${selectedItem.middlename} ${selectedItem.lastname}`
  const dateValue = selectedItem?.date
    ? format(new Date(selectedItem.date), 'MMMM d, yyyy')
    : '________________'

  return (
    <div className="fixed left-[-9999px] top-0 w-[816px] print:left-0 print:relative print:m-16">
      <div ref={ref} className="w-[816px] bg-white py-2 px-8 m-12 print:m-0 print:p-12">
        {/* DepEd Header with Official Logos */}
        <table className="w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="relative">
                <div className="flex items-center justify-center gap-6">
                  <LogoImg
                    src={DEPED_LOGOS.logo1}
                    alt="DepEd Seal"
                    width={80}
                  />
                  <div className="text-center">
                    <div className="text-sm font-bold text-[#003366]">
                      Republic of the Philippines
                    </div>
                    <div className="text-sm font-bold text-[#003366]">
                      Department of Education
                    </div>
                    <div className="text-base font-bold">
                      Schools Division Office of Bayugan City
                    </div>
                  </div>
                  <LogoImg
                    src={DEPED_LOGOS.logo2}
                    alt="DepEd"
                    width={80}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="border-t-2 border-black mt-4 w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="text-center pt-4">
                <div className="font-bold text-sm text-[#003366]">
                  CS Form No. 32 (Revised 2017)
                </div>
                <div className="font-bold text-xl mt-1">OATH OF OFFICE</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-1 pt-6">
                <div className="text-justify leading-relaxed space-y-4">
                  <p>
                    I,{' '}
                    <span className="font-bold underline underline-offset-2">
                      {fullName}
                    </span>
                    , of the position of{' '}
                    <span className="font-bold underline underline-offset-2">
                      {positionName}
                    </span>
                    , hereby solemnly swear that I will faithfully discharge to
                    the best of my ability the duties of my present position and
                    of all others that I may hereafter hold under the Republic of
                    the Philippines; that I will bear true faith and allegiance
                    to the Constitution of the Philippines; that I will obey the
                    laws, legal orders and decrees promulgated by the duly
                    constituted authorities; and that I will well and faithfully
                    discharge to the best of my ability the duties of the
                    position upon which I am about to enter.
                  </p>
                  <p className="text-center font-bold">SO HELP ME GOD.</p>

                  <div className="mt-8 flex justify-end">
                    <div className="text-center">
                      <div className="font-bold underline underline-offset-2 border-b border-black min-w-[200px]">
                        {fullName}
                      </div>
                      <div className="text-sm mt-1">Name &amp; Signature</div>
                      <div className="font-bold underline underline-offset-2 border-b border-black min-w-[120px] mt-4">
                        {dateValue}
                      </div>
                      <div className="text-sm mt-1">Date</div>
                    </div>
                  </div>

                  <div className="mt-12">
                    <p className="text-sm">
                      Subscribed and sworn to before me this{' '}
                      <span className="font-bold underline">{dateValue}</span>,
                      at the Schools Division Office of Bayugan City.
                    </p>
                    <div className="mt-8 flex justify-end">
                      <div className="text-center">
                        <div className="font-bold underline underline-offset-2 border-b border-black min-w-[200px]">
                          {selectedItem.signatory || '_______________________'}
                        </div>
                        <div className="text-sm mt-1">
                          {selectedItem.position || 'Administering Officer'}
                        </div>
                      </div>
                    </div>
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
