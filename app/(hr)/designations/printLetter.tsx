import type { DesignationTypes } from '@/types'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

// import 'jspdf-autotable'

// Render a paragraph with inline **bold** segments, word-wrapping at rightEdgeX.
// Returns the y-cursor advanced past the last line, matching the prior loop's
// end-of-paragraph semantics.
function drawRichParagraph (
  doc: jsPDF,
  paragraph: string,
  startY: number,
  firstLineX: number,
  wrapX: number,
  rightEdgeX: number,
  lineHeight: number
): number {
  interface Word { text: string, bold: boolean, width: number }

  const segments: Array<{ text: string, bold: boolean }> = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(paragraph)) !== null) {
    if (m.index > last) segments.push({ text: paragraph.slice(last, m.index), bold: false })
    segments.push({ text: m[1], bold: true })
    last = re.lastIndex
  }
  if (last < paragraph.length) segments.push({ text: paragraph.slice(last), bold: false })

  const words: Word[] = []
  for (const s of segments) {
    for (const part of s.text.split(/\s+/)) {
      if (!part) continue
      doc.setFont('times', s.bold ? 'bold' : 'normal')
      words.push({ text: part, bold: s.bold, width: doc.getTextWidth(part) })
    }
  }

  if (words.length === 0) {
    doc.setFont('times', 'normal')
    return startY + lineHeight
  }

  doc.setFont('times', 'normal')
  const spaceWidth = doc.getTextWidth(' ')

  // Build lines
  const lines: Array<{ words: Word[], lineX: number }> = []
  let lineWords: Word[] = []
  let lineUsed = 0
  let onFirstLine = true

  for (const word of words) {
    const lineX = onFirstLine ? firstLineX : wrapX
    const maxWidth = rightEdgeX - lineX
    const needed = lineWords.length === 0 ? word.width : lineUsed + spaceWidth + word.width

    if (lineWords.length > 0 && needed > maxWidth) {
      lines.push({ words: lineWords, lineX })
      onFirstLine = false
      lineWords = [word]
      lineUsed = word.width
    } else {
      lineWords.push(word)
      lineUsed = needed
    }
  }
  if (lineWords.length > 0) {
    lines.push({ words: lineWords, lineX: onFirstLine ? firstLineX : wrapX })
  }

  // Render with full justification (last line left-aligned)
  let y = startY
  for (let i = 0; i < lines.length; i++) {
    const { words: lw, lineX } = lines[i]
    const isLast = i === lines.length - 1

    if (isLast || lw.length === 1) {
      let cx = lineX
      for (const w of lw) {
        doc.setFont('times', w.bold ? 'bold' : 'normal')
        doc.text(w.text, cx, y)
        cx += w.width + spaceWidth
      }
    } else {
      const totalWordWidth = lw.reduce((s, w) => s + w.width, 0)
      const gap = (rightEdgeX - lineX - totalWordWidth) / (lw.length - 1)
      let cx = lineX
      for (const w of lw) {
        doc.setFont('times', w.bold ? 'bold' : 'normal')
        doc.text(w.text, cx, y)
        cx += w.width + gap
      }
    }

    y += lineHeight
  }

  doc.setFont('times', 'normal')
  return y
}

export async function printLetter (item: DesignationTypes, letterDate: string, letterSubject: string, letterContent: string) {
  // Folio (long bond), portrait, millimeters — 215.9mm x 330.2mm
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({ unit: 'mm', format: [215.9, 330.2] })

  // Header Logo
  const logo = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/deped_logo.png`
  const footerLogo = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/footer_logo.png`
  const rpText = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/rp_text.png`
  const depedText = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/images/deped_text.png`

  doc.addImage(logo, 'PNG', 93, 8, 25, 25)
  doc.addImage(rpText, 'PNG', 80, 35, 50, 4)
  doc.addImage(depedText, 'PNG', 70, 40, 70, 6)

  // Header Text
  doc.setFont('times', 'bold')
  doc.setFontSize(10)
  doc.setTextColor('#000')
  doc.text('SCHOOLS DIVISION OFFICE OF BAYUGAN CITY', 105, 51, { align: 'center' })

  // line
  doc.line(15, 55, 195, 55)

  let y = 62

  // Begin Document Title
  doc.setFontSize(11)
  doc.text('Office of the Schools Division Superintendent', 15, y)

  y += 12
  doc.setFont('times', 'normal')
  doc.text('To', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ' + (item.hrm_users?.firstname + ' ' + item.hrm_users?.middlename + ' ' + item.hrm_users?.lastname).toUpperCase(), 40, y)
  y += 10
  const sdsSignaturePath = process.env.NEXT_PUBLIC_SDS_SIGNATURE ?? ''
  if (sdsSignaturePath) {
    const sdsSignatureUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}${sdsSignaturePath}`
    doc.addImage(sdsSignatureUrl, 'PNG', 42, y, 40, 12)
    y += 13
  }
  doc.setFont('times', 'normal')
  doc.text('From', 15, y)
  doc.setFont('times', 'bold')
  doc.text(': ' + `${process.env.NEXT_PUBLIC_SDS ?? ''}`, 40, y)
  y += 5
  doc.setFont('times', 'normal')
  doc.text('OIC - Schools Division Superintendent', 42, y)
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

  // letter body — render paragraph-by-paragraph, parsing **bold** markers.
  doc.setFont('times', 'normal')
  for (const paragraph of letterContent.split('\n')) {
    y = drawRichParagraph(doc, paragraph, y, 35, 15, 195, 5.5)
    y += 3
  }

  y += 20
  // End letter body

  // Two-column bottom block: CC list on the left, Conformed signature on the right.
  const bottomY = y

  // Left column: CC (copy furnish)
  doc.setFont('times', 'normal')
  doc.text('CC:  School Head', 15, bottomY)
  doc.text('       District In-Charge', 15, bottomY + 5)
  doc.text('       Division Planning Officer', 15, bottomY + 10)
  doc.text('       File Copy', 15, bottomY + 15)

  // Right column: Conformed signature
  doc.text('Conformed:', 105, bottomY)
  y = bottomY + 10
  doc.line(120, y, 180, y)
  y += 5
  doc.text('Name & Signature', 130, y)
  y += 12
  doc.line(130, y, 170, y)
  y += 5
  doc.text('Date', 145, y)
  // End signature

  // Start footer
  y = 305
  doc.addImage(footerLogo, 'PNG', 15, y + 2, 180, 18)
  // End footer

  doc.save('DesignationOrder.pdf')
}
