import type { DesignationTypes } from '@/types'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

// import 'jspdf-autotable'

export async function printLetter (item: DesignationTypes, letterDate: string, letterSubject: string, letterContent: string) {
  // Default export is a4 paper, portrait, using millimeters for units 210mm x 297mm
  // eslint-disable-next-line new-cap
  const doc = new jsPDF()

  // Header Logo
  const logo = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/deped_logo.png`
  const bayuganLogo = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/bayugan_logo.png`
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

  let y = 62

  // Begin Document Title
  doc.setFontSize(14)
  doc.text('Office of the Schools Division Superintendent', 15, y)

  y += 15
  doc.setFont('times', 'normal')
  doc.text('To', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ' + (item.hrm_users?.firstname + ' ' + item.hrm_users?.middlename + ' ' + item.hrm_users?.lastname).toUpperCase(), 40, y)
  y += 10
  doc.setFont('times', 'normal')
  doc.text('From', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ' + `${process.env.NEXT_PUBLIC_SDS ?? ''}`, 40, y)
  y += 5
  doc.setFont('times', 'normal')
  doc.text('School Division Superintendent', 42, y)
  y += 10
  doc.setFont('times', 'normal')
  doc.text('Date', 15, y)
  doc.text(': ' + format(new Date(letterDate), 'MMMM d, yyyy'), 40, y)
  y += 10
  doc.setFont('times', 'normal')
  doc.text('Subject', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ' + letterSubject, 40, y)
  y += 10
  // End Document Title

  // line
  doc.line(15, y, 195, y)

  y += 10

  // letter body
  doc.setFont('times', 'normal')
  const content = letterContent
  const paragraphs = content.split('\n')

  for (const paragraph of paragraphs) {
    const maxWidth = 160
    const line = doc.splitTextToSize(paragraph, maxWidth)

    for (let i = 0; i < line.length; i++) {
      if (i === 0) {
        doc.text(line[i], 35, y)
      } else {
        doc.text(line[i], 15, y)
      }
      y += 7
    }
  }

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
  // line
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
  // End footer

  doc.save('Assignment.pdf')
}
