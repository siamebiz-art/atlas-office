import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export const runtime = "nodejs"

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function POST(req: NextRequest) {
  const { content, title } = await req.json()

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 595
  const pageHeight = 842
  const margin = 56
  const lineHeight = 18
  const fontSize = 11

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  function addText(text: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) {
    const f = opts.bold ? boldFont : font
    const size = opts.size ?? fontSize
    const c = opts.color ?? [0.9, 0.9, 0.9]
    const words = text.split(" ")
    let line = ""
    const maxW = pageWidth - margin * 2

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const w = f.widthOfTextAtSize(testLine, size)
      if (w > maxW && line) {
        if (y < margin + lineHeight) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin }
        page.drawText(line, { x: margin, y, size, font: f, color: rgb(...c) })
        y -= lineHeight
        line = word
      } else {
        line = testLine
      }
    }
    if (line) {
      if (y < margin + lineHeight) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin }
      page.drawText(line, { x: margin, y, size, font: f, color: rgb(...c) })
      y -= lineHeight
    }
  }

  // Dark background
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.027, 0.027, 0.059) })

  // Title
  addText(title || "Document", { bold: true, size: 20, color: [1, 1, 1] })
  y -= 8

  const textContent = htmlToText(content ?? "")
  for (const line of textContent.split("\n")) {
    if (!line.trim()) { y -= lineHeight / 2; continue }
    addText(line.trim(), { size: fontSize, color: [0.78, 0.82, 0.88] })
  }

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${(title || "document").replace(/[^a-zA-Z0-9\s]/g, "_")}.pdf"`,
    },
  })
}
