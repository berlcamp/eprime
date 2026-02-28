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

/**
 * CS Form No. 4: Certification of Assumption to Duty
 * CSC standard format per 2025 Omnibus Rules on Appointments
 */
export const PrintAssumption = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

  if (!selectedItem?.date) {
    return null
  }

  const targetDate = new Date(selectedItem.date)
  const formattedDate = format(targetDate, "do 'day of' MMMM, yyyy")
  const honorific =
    selectedItem?.sex === 'Female' ? 'Ms.' : selectedItem?.sex === 'Male' ? 'Mr.' : ''
  const positionName =
    selectedItem?.ranking?.position?.name ||
    selectedItem?.hrm_item?.hrm_position?.name ||
    'N/A'
  const assignment = selectedItem?.assignment || 'Schools Division Office of Bayugan City'

  return (
    <div className="fixed left-[-9999px] top-0 w-[816px] print:left-0 print:relative print:m-16">
      <div ref={ref} className="w-[816px] bg-white py-2 px-8 m-12 print:m-0 print:p-12">
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
              <td colSpan={2} className="text-center pt-4">
                <div className="font-bold text-sm text-[#003366]">
                  CS Form No. 4 (Revised 2025)
                </div>
                <div className="font-bold text-xl mt-1">
                  CERTIFICATION OF ASSUMPTION TO DUTY
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-1 pt-4">
                <div className="text-justify leading-relaxed space-y-3">
                  <p>
                    This is to certify that {honorific}{' '}
                    <span className="font-bold underline underline-offset-2">
                      {selectedItem.firstname} {selectedItem.middlename}{' '}
                      {selectedItem.lastname}
                    </span>{' '}
                    has assumed the duties and responsibilities as{' '}
                    <span className="font-bold underline underline-offset-2">
                      {positionName}
                    </span>{' '}
                    of{' '}
                    <span className="font-bold">{assignment}</span> effective{' '}
                    <span className="underline underline-offset-2">
                      {format(targetDate, 'MMMM d, yyyy')}
                    </span>
                    .
                  </p>
                  <p className="indent-8">
                    This certification is issued in connection with the
                    issuance of the appointment of {honorific}{' '}
                    <span className="font-bold underline underline-offset-2">
                      {selectedItem.firstname} {selectedItem.middlename}{' '}
                      {selectedItem.lastname}
                    </span>{' '}
                    as{' '}
                    <span className="font-bold underline underline-offset-2">
                      {positionName}
                    </span>{' '}
                    pursuant to existing civil service rules and regulations.
                  </p>
                  <p className="indent-8">
                    Done this {formattedDate} at the Schools Division Office of
                    Bayugan City.
                  </p>
                </div>

                {/* Signed by Head of Office - CSC requirement */}
                <div className="mt-10 flex justify-end">
                  <div className="text-center">
                    <div className="font-bold underline underline-offset-2">
                      {selectedItem.signatory || '_______________________'}
                    </div>
                    <div className="text-sm">
                      {selectedItem.position || 'Head of Office'}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  Date:{' '}
                  {selectedItem.date &&
                    format(new Date(selectedItem.date), 'MMMM d, yyyy')}
                </div>

                {/* Attested by HRMO - CSC requirement */}
                <div className="mt-8">
                  <div className="text-sm font-bold">Attested by:</div>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="text-center">
                    <div className="font-bold underline underline-offset-2">
                      JASMINE B. NEPA
                    </div>
                    <div className="text-sm">
                      Administrative Officer IV - HRMO
                    </div>
                  </div>
                </div>

                <div className="text-xs mt-8">
                  <strong>Distribution:</strong> 201 File / Admin / COA / CSC Field
                  Office (within 30 days from assumption)
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
