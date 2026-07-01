import { NextRequest, NextResponse } from "next/server"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"

export const runtime = "nodejs"

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const stripped = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n[H1]$1[/H1]\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n[H2]$1[/H2]\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n[H3]$1[/H3]\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "$1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")

  for (const line of stripped.split("\n")) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith("[H1]")) {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t.replace(/\[H1\]|\[\/H1\]/g, ""))] }))
    } else if (t.startsWith("[H2]")) {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t.replace(/\[H2\]|\[\/H2\]/g, ""))] }))
    } else if (t.startsWith("[H3]")) {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t.replace(/\[H3\]|\[\/H3\]/g, ""))] }))
    } else if (t.startsWith("•")) {
      paragraphs.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(t.slice(1).trim())] }))
    } else {
      paragraphs.push(new Paragraph({ children: [new TextRun(t)] }))
    }
  }
  return paragraphs
}

export async function POST(req: NextRequest) {
  const { content, title } = await req.json()

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: title || "Document", bold: true })] }),
        new Paragraph({ children: [new TextRun("")] }),
        ...htmlToDocxParagraphs(content ?? ""),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${(title || "document").replace(/[^a-zA-Z0-9ก-๙\s]/g, "_")}.docx"`,
    },
  })
}
