import type { AssignmentTypes } from '@/types'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { capitalizeWords } from '@/utils/text-helper'

// import 'jspdf-autotable'

export async function printLetter (item: AssignmentTypes) {
  // Default export is a4 paper, portrait, using millimeters for units 210mm x 297mm
  // eslint-disable-next-line new-cap
  const doc = new jsPDF()

  // Header Logo
  const logo = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/deped_logo.png`
  const rpText = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/rp_text.png`
  const depedText = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/deped_text.png`

  doc.addImage(logo, 'PNG', 93, 8, 25, 25)
  doc.addImage(rpText, 'PNG', 80, 35, 50, 4)
  doc.addImage(depedText, 'PNG', 70, 40, 70, 6)

  // Header Text
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.setTextColor('#000')
  doc.text('SCHOOLS DIVISION OFFICE OF BAYUGAN CITY', 105, 51, { align: 'center' })

  // line
  doc.line(15, 55, 195, 55)

  let y = 65

  // Begin Document Title
  doc.setFontSize(14)
  const text = 'Office of the Schools Division Superintendent'
  const maxWidth = 80
  const lines = doc.splitTextToSize(text, maxWidth)
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], 15, y)
    y += 5
  }

  y += 5
  doc.text('MEMORANDUM', 15, y)

  y += 10
  doc.setFont('times', 'normal')
  doc.text('To', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ' + (item.hrm_users?.firstname + ' ' + item.hrm_users?.middlename + ' ' + item.hrm_users?.lastname).toUpperCase(), 40, y)
  y += 10
  doc.setFont('times', 'normal')
  doc.text('From', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': MA. TERESA M. REAL', 40, y)
  y += 10
  doc.setFont('times', 'normal')
  doc.text('Date', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ' + format(new Date(), 'MMMM d, yyyy'), 40, y)
  y += 10
  doc.setFont('times', 'normal')
  doc.text('Subject', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ASSIGNMENT ORDER', 40, y)
  y += 10
  // End Document Title

  // line
  doc.line(15, y, 195, y)

  y += 10

  // letter body
  doc.setFont('times', 'normal')
  let station = ''
  if (item.area_assigned === 'school') {
    station = item.hrm_schools?.name
  } else {
    station = item.hrm_offices?.name
  }
  const sentence1 = 'You are hereby advised of your assignment as ' + (item.hrm_positions?.name).toUpperCase() + ' at ' + capitalizeWords(station) + ' effective ' + format(new Date(item.from), 'MMMM d, yyyy') + '. This order is subject to the exigency of service.'
  const maxWidth1 = 160
  const lines1 = doc.splitTextToSize(sentence1, maxWidth1)
  for (let i = 0; i < lines1.length; i++) {
    if (i === 0) {
      doc.text(lines1[i], 35, y)
    } else {
      doc.text(lines1[i], 15, y)
    }
    y += 10
  }
  const sentence2 = 'As such you are to perform duties and responsibilities concomitant to your position.'
  const lines2 = doc.splitTextToSize(sentence2, maxWidth1)
  for (let i = 0; i < lines2.length; i++) {
    if (i === 0) {
      doc.text(lines2[i], 35, y)
    } else {
      doc.text(lines2[i], 15, y)
    }
    y += 10
  }

  const sentence3 = 'You are further advised to report immediately to the School Head for specific instructions.'
  const lines3 = doc.splitTextToSize(sentence3, maxWidth1)
  for (let i = 0; i < lines3.length; i++) {
    if (i === 0) {
      doc.text(lines3[i], 35, y)
    } else {
      doc.text(lines3[i], 15, y)
    }
    y += 10
  }
  doc.text('Please be guided accordingly.', 35, y)
  y += 20
  // End letter body

  // Start signature
  doc.text('Conformed:', 105, y)
  y += 10
  doc.line(120, y, 180, y)
  y += 5
  doc.text('Name & Signature', 130, y)
  y += 12
  doc.line(130, y, 170, y)
  y += 5
  doc.text('Date', 145, y)
  // End signature

  // Start footer
  doc.text('CC: School Head', 15, 280)
  doc.text('File Copy', 20, 285)
  // End footer

  doc.save('Assignment.pdf')
}
