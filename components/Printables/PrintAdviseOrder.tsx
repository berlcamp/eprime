/* eslint-disable @next/next/no-img-element */
import { ApplicantTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

// DepEd official logos and footer logos
const LOGOS = {
  deped1: '/logos/deped_logo_1.png',
  deped2: '/logos/deped_logo_2.png',
  matatag: { primary: '/logos/matatag.png', fallback: '/logos/matatag.svg' },
  bagong: { primary: '/logos/bagong.png', fallback: '/logos/bagong.svg' },
  bayugan: { primary: '/logos/bayugan.png', fallback: '/logos/bayugan.svg' },
}

const LogoImg = ({
  src,
  fallback,
  alt,
  width,
  ...props
}: {
  src: string
  fallback: string
  alt: string
  width: number
  [key: string]: unknown
}) => {
  const [imgSrc, setImgSrc] = React.useState(src)
  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      onError={() => setImgSrc(fallback)}
      {...props}
    />
  )
}

interface ComponentToPrintProps {
  selectedItem: ApplicantTypes
}

export const PrintAdviseOrder = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    'N/A'
  const assignment = selectedItem?.assignment || 'this Division'
  const honorific =
    selectedItem?.sex === 'Female' ? 'Ms.' : selectedItem?.sex === 'Male' ? 'Mr.' : ''

  return (
    <div className="fixed left-[-9999px] top-0 w-[816px] print:left-0 print:relative print:m-16">
      <div ref={ref} className="w-[816px] bg-white py-2 px-4 m-12 print:m-0 print:p-12">
        {/* CSC/DepEd Standard Header with Logos */}
        <table className="w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="relative">
                <div className="flex items-center justify-center gap-4">
                  <LogoImg
                    src={LOGOS.deped1}
                    fallback="/deped_header.svg"
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
                    src={LOGOS.deped2}
                    fallback="/deped_header.svg"
                    alt="DepEd"
                    width={80}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="border-t-2 border-black mt-2 w-full">
          <tbody>
            <tr>
              <td colSpan={2} className="pt-2">
                <div className="font-bold text-sm">
                  Office of the Schools Division Superintendent
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-1">
                <div className="font-bold text-base">MEMORANDUM</div>
              </td>
            </tr>
            <tr>
              <td className="py-2 w-16 align-top">To</td>
              <td className="font-bold">
                : {honorific} {selectedItem.firstname} {selectedItem.middlename}{' '}
                {selectedItem.lastname}
              </td>
            </tr>
            <tr>
              <td className="py-2 align-top">From</td>
              <td className="font-bold">
                <div>: MA. TERESA M. REAL</div>
                <div className="font-normal pl-2 text-sm">
                  OIC-Schools Division Superintendent
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-2">Date</td>
              <td>
                :{' '}
                {selectedItem.date
                  ? format(new Date(selectedItem.date), 'MMMM d, yyyy')
                  : '________________'}
              </td>
            </tr>
            <tr>
              <td className="py-2">Subject</td>
              <td className="font-bold">: ADVICE ORDER</td>
            </tr>
            <tr>
              <td colSpan={2} className="border-t-2 border-black pt-4">
                <div className="text-justify leading-relaxed">
                  <p className="indent-8 mb-3">
                    You are hereby advised of your appointment to the position of{' '}
                    <span className="font-bold">{positionName}</span> of{' '}
                    <span className="font-bold">{assignment}</span>{' '}
                    effective immediately per the issuance of your appointment.
                  </p>
                  <p className="indent-8 mb-3">
                    As such, you are to perform the duties and responsibilities
                    concomitant to your assignment in accordance with existing
                    civil service rules and regulations.
                  </p>
                  <p className="indent-8 mb-3">
                    You are further advised to report immediately to the School
                    Head/Immediate Supervisor for specific instructions.
                  </p>
                  <p className="indent-8">Please be guided accordingly.</p>

                  <div className="mt-10 flex justify-end">
                    <div className="text-center min-w-[200px]">
                      <div className="text-sm mb-3">Conforme:</div>
                      <div className="border-b-2 border-black h-5 w-full" />
                      <div className="text-xs mt-1">Name &amp; Signature</div>
                      <div className="border-b-2 border-black h-5 w-full mt-4" />
                      <div className="text-xs mt-1">Date</div>
                    </div>
                  </div>
                  <div className="text-xs mt-6">
                    <strong>CC:</strong> School Head / District In-Charge / Division
                    Planning Officer / 201 File
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-xs pt-4">
                <div className="border-t-2 border-black pt-2 flex items-center gap-2">
                  <LogoImg
                    src={LOGOS.matatag.primary}
                    fallback={LOGOS.matatag.fallback}
                    alt="Matatag"
                    width={40}
                  />
                  <LogoImg
                    src={LOGOS.bagong.primary}
                    fallback={LOGOS.bagong.fallback}
                    alt="Bagong Pilipinas"
                    width={40}
                  />
                  <LogoImg
                    src={LOGOS.bayugan.primary}
                    fallback={LOGOS.bayugan.fallback}
                    alt="Bayugan City"
                    width={40}
                  />
                  <div>
                    <div>Lanzones Street, Poblacion, Bayugan City</div>
                    <div className="text-blue-600">deped.bayugan@gmail.com</div>
                    <div>Tel: (085) 303-0664</div>
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
