import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const client = getAnthropic()

  const systemPrompt = `คุณเป็นผู้เชี่ยวชาญด้านเอกสารธุรกิจ วิเคราะห์เอกสารที่ได้รับและสร้าง Template

ระบุ:
1. ชื่อเอกสาร (ภาษาไทย)
2. หมวดหมู่: sales | hr | finance | government | legal | general
3. ชื่อ Folder แนะนำ (ภาษาไทย) สำหรับจัดเก็บ template นี้ เช่น "งานขาย", "HR", "บัญชีการเงิน", "ราชการ", "กฎหมาย", "รายงานโครงการ"
4. ตัวแปรที่เปลี่ยนได้ (ชื่อ วันที่ จำนวนเงิน บริษัท ฯลฯ) โดยเฉพาะข้อมูลที่จะเปลี่ยนในแต่ละครั้ง

ตอบเป็น JSON เท่านั้น:
{
  "name": "ชื่อเอกสาร",
  "category": "sales|hr|finance|government|legal|general",
  "folder": "ชื่อ Folder ภาษาไทย",
  "variables": [
    {"key": "VariableName", "label": "ชื่อภาษาไทย", "placeholder": "ตัวอย่าง", "multiline": false, "required": true}
  ]
}`

  let messageContent: MessageParam["content"]

  if (file.type === "application/pdf") {
    const b64 = buffer.toString("base64")
    messageContent = [
      {
        type: "document" as const,
        source: { type: "base64" as const, media_type: "application/pdf" as const, data: b64 },
      },
      { type: "text" as const, text: "วิเคราะห์เอกสาร PDF นี้และสร้าง Template ตามที่กำหนด" },
    ]
  } else {
    // DOCX or other text-based files
    let textContent = ""
    try {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      textContent = result.value
    } catch {
      textContent = buffer.toString("utf-8").slice(0, 8000)
    }
    messageContent = [
      { type: "text" as const, text: `เนื้อหาเอกสาร:\n${textContent.slice(0, 8000)}\n\nวิเคราะห์และสร้าง Template` },
    ]
  }

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: messageContent }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return NextResponse.json({
        name: parsed.name,
        category: parsed.category,
        folder: parsed.folder ?? parsed.category ?? "ทั่วไป",
        variables: parsed.variables ?? [],
      })
    }
  } catch { /* fall through */ }

  return NextResponse.json({ error: "Cannot parse response" }, { status: 500 })
}
