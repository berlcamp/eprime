/* eslint-disable new-cap */
import type { ApplicantTypes, RankingTypes } from '@/types'
import { capitalizeWords } from '@/utils/text-helper'
import { jsPDF } from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'

interface ListTypes {
  applicant: ApplicantTypes
  accumulated_points: Record<string, number> | null
  overall_score: string
  ranking: RankingTypes
}

export async function IesAttachment(item: ListTypes) {
  const doc = new jsPDF()

  // Header Logos
  const logo = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/deped_logo.png`
  const bayuganLogo = `${
    process.env.NEXT_PUBLIC_BASE_URL ?? ''
  }/images/bayugan_logo.png`
  const rpText = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/rp_text.png`
  const depedText = `${
    process.env.NEXT_PUBLIC_BASE_URL ?? ''
  }/images/deped_text.png`

  doc.addImage(logo, 'PNG', 93, 8, 25, 25)
  doc.addImage(rpText, 'PNG', 80, 35, 50, 4)
  doc.addImage(depedText, 'PNG', 70, 40, 70, 6)

  // Header Text
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.setTextColor('#000')
  doc.text('SCHOOLS DIVISION OFFICE OF BAYUGAN CITY', 105, 51, {
    align: 'center'
  })

  // Line
  doc.line(15, 55, 195, 55)
  let y = 62

  // Document Title
  doc.setFontSize(12)
  doc.text('INDIVIDUAL EVALUATION SHEET (IES)', 105, y, { align: 'center' })
  y += 10
  doc.setFontSize(10)
  doc.setFont('times', 'normal')
  doc.text('Name of Applicant: ', 15, y)
  doc.setFont('times', 'bold')
  doc.text(
    capitalizeWords(
      item.applicant?.firstname +
        ' ' +
        item.applicant?.middlename +
        ' ' +
        item.applicant?.lastname
    ),
    70,
    y
  )

  y += 6
  doc.setFont('times', 'normal')
  doc.text('Application Code: ', 15, y)
  doc.setFont('times', 'bold')
  doc.text((item.applicant?.code).toUpperCase(), 70, y)
  y += 6
  doc.setFont('times', 'normal')
  doc.text('Position Applied for: ', 15, y)
  doc.setFont('times', 'bold')
  doc.text(item.ranking.position.name, 70, y)
  y += 6
  doc.setFont('times', 'normal')
  doc.text('Schools Division Office: ', 15, y)
  doc.setFont('times', 'bold')
  doc.text('DepEd Bayugan City', 70, y)
  y += 6
  doc.setFont('times', 'normal')
  doc.text('Contact Number: ', 15, y)
  doc.setFont('times', 'bold')
  doc.text('(085) 303-0664', 70, y)
  y += 6
  doc.setFont('times', 'normal')
  doc.text('Job Group/ SG-Level: ', 15, y)
  doc.setFont('times', 'bold')
  // Determine the level based on salary grade
  let level = ''
  if (
    Number(item.ranking.position.salary_grade) >= 1 &&
    Number(item.ranking.position.salary_grade) <= 9
  ) {
    level = '1st Level'
  } else if (
    Number(item.ranking.position.salary_grade) >= 10 &&
    Number(item.ranking.position.salary_grade) <= 22
  ) {
    level = '2nd Level'
  } else if (Number(item.ranking.position.salary_grade) >= 23) {
    level = '3rd Level'
  } else {
    level = '2nd Level' // Fallback for unexpected values
  }
  doc.text(
    item.ranking.position.type +
      '/ SG ' +
      item.ranking.position.salary_grade +
      ' - ' +
      level,
    70,
    y
  )
  y += 5

  // Define table headers
  const tableHeaders: RowInput[] = [
    [
      {
        content: 'Criteria',
        rowSpan: 2,
        styles: {
          halign: 'center' as const, // 👈 Ensure correct type
          valign: 'middle' as const,
          lineWidth: 0.3, // 👈 Ensure number type
          lineColor: [0, 0, 0] // 👈 Ensure number[] type (black border)
        }
      },
      {
        content: 'Weight Allocation',
        rowSpan: 2,
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          lineWidth: 0.3,
          lineColor: [0, 0, 0]
        }
      },
      {
        content: "Applicant's Actual Qualification",
        colSpan: 3,
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          lineWidth: 0.3,
          lineColor: [0, 0, 0]
        }
      }
    ],
    [
      {
        content: "Details of Applicant's Qualification",
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          lineWidth: 0.3,
          lineColor: [0, 0, 0]
        }
      },
      {
        content: 'Computation',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          lineWidth: 0.3,
          lineColor: [0, 0, 0]
        }
      },
      {
        content: 'Actual Score',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          lineWidth: 0.3,
          lineColor: [0, 0, 0]
        }
      }
    ]
  ]

  // Generate table rows dynamically based on `item.ranking.criterias`
  const tableBody = item.ranking.criterias.map((criteria) => {
    const actualScore = item.accumulated_points
      ? Object.entries(item.accumulated_points)
          .filter(([criteriaName]) => criteriaName === criteria.name)
          .map(([_, avgPoints]) => avgPoints.toFixed(3))
          .join(', ') // Join in case of multiple scores
      : ''

    return [criteria.name, criteria.points, '', '', actualScore]
  })
  tableBody.push(['Total', '100', '', '', item.overall_score])

  // Table Content
  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid', // Ensures grid-like borders
    styles: { fontSize: 10, lineWidth: 0.3, lineColor: [0, 0, 0] }, // Black border for all cells
    headStyles: { fillColor: [102, 204, 0], textColor: [0, 0, 0] }
  })

  // Correctly retrieve the last table Y position
  y = Number((doc as any).lastAutoTable?.finalY) + 7

  doc.setFont('times', 'normal')

  const content = `I hereby attest to the conduct of the application and assessment process in accordance with the applicable guidelines; and acknowledge, upon discussion with the Human Resource Merit Promotion and Selection Board (HRMPSB), the result of the comparative assessment and the points given to me based on my qualification and submitted documentary requirements for the ${item.ranking.position.name} under ${item.ranking.department} level. \n \nFurthermore, I hereby affix my signature in this Form to attest to the objective and judicious conduct of the HRMPSB evaluation through Open Ranking System.`
  const paragraphs = content.split('\n')

  for (const paragraph of paragraphs) {
    const maxWidth = 170
    const line = doc.splitTextToSize(paragraph, maxWidth)

    for (let i = 0; i < line.length; i++) {
      doc.text(line[i], 15, y)
      y += 5
    }
  }

  y += 5

  // Signature Section
  doc.setFont('times', 'bold')
  doc.text(
    capitalizeWords(
      item.applicant?.firstname +
        ' ' +
        item.applicant?.middlename +
        ' ' +
        item.applicant?.lastname
    ),
    120,
    y
  )
  y += 2
  doc.line(120, y, 180, y)
  y += 5
  doc.setFont('times', 'normal')
  doc.text('Name & Signature of Applicant', 125, y)
  y += 6
  doc.text('Date:', 125, y)

  y += 6
  doc.text('Attested by:', 15, y)
  y += 10

  // Signature Section
  doc.setFont('times', 'bold')
  doc.text('Corazon P. Roa', 15, y)
  y += 2
  doc.line(15, y, 75, y)
  y += 5
  doc.setFont('times', 'normal')
  doc.text('OIC-ASDS, HRMPSB Chairperson', 15, y)

  // Footer
  y = 265
  doc.line(15, y, 195, y)
  y += 5
  doc.setFontSize(10)
  doc.addImage(bayuganLogo, 'PNG', 15, 266, 20, 20)
  doc.text('Lanzones Street, Poblacion, Bayugan City', 37, y)
  y += 5
  doc.text('deped.bayugan@gmail.com', 37, y)
  y += 5
  doc.text('Telephone Number: (085) 303-0664', 37, y)

  doc.save('IES.pdf')
}
