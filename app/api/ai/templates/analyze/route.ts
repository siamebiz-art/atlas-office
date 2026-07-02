import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages"

export const runtime = "nodejs"

const systemPrompt = `คุณเป็นผู้เชี่ยวชาญด้านเอกสารธุรกิจ วิเคราะห์เอกสารที่ได้รับและสร้าง Template พร้อม pre-fill ค่าจริงจากเอกสาร

ระบุ:
1. ชื่อเอกสาร (ภาษาไทย)
2. หมวดหมู่: sales | hr | finance | government | legal | general
3. ชื่อ Folder แนะนำ (ภาษาไทย) เช่น "งานขาย", "HR", "บัญชีการเงิน", "ราชการ", "กฎหมาย"
4. ตัวแปรทุกตัวที่เปลี่ยนได้ พร้อมทั้ง:
   - label: ชื่อ field ภาษาไทย
   - key: ชื่อ key ภาษาอังกฤษ camelCase
   - placeholder: ตัวอย่างทั่วไป (ไม่ใช่ค่าจากเอกสาร)
   - value: ค่าจริงที่อยู่ในเอกสารนี้ (ถ้ามี ให้ใส่ค่าจริง ถ้าไม่มีให้เป็น "")
   - multiline: true ถ้าเป็นข้อความยาว
   - required: true ถ้าจำเป็น

ตอบเป็น JSON เท่านั้น (ไม่มี markdown):
{
  "name": "ชื่อเอกสาร",
  "category": "sales|hr|finance|government|legal|general",
  "folder": "ชื่อ Folder ภาษาไทย",
  "variables": [
    {"key": "docNo", "label": "เลขที่หนังสือ", "placeholder": "ที่ .../2568", "value": "พิเศษ/2568", "multiline": false, "required": true}
  ]
}`

function parseResponse(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  const parsed = JSON.parse(match[0])
  return {
    name: parsed.name,
    category: parsed.category,
    folder: parsed.folder ?? parsed.category ?? "ทั่วไป",
    variables: parsed.variables ?? [],
  }
}

export async function POST(req: NextRequest) {
  const client = getAnthropic()
  const contentType = req.headers.get("content-type") ?? ""

  let messageContent: MessageParam["content"]

  if (contentType.includes("application/json")) {
    // Direct text from document editor
    const { text, name } = await req.json()
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 })
    const docHeader = name ? `ชื่อเอกสาร: ${name}\n\n` : ""
    messageContent = [
      { type: "text" as const, text: `${docHeader}เนื้อหาเอกสาร:\n${text.slice(0, 8000)}\n\nวิเคราะห์และสร้าง Template` },
    ]
  } else {
    // FormData file upload
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

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
  }

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: messageContent }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""

  try {
    const result = parseResponse(text)
    if (result) return NextResponse.json(result)
  } catch { /* fall through */ }

  return NextResponse.json({ error: "Cannot parse response" }, { status: 500 })
}
