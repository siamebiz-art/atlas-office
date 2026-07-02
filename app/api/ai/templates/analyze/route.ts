import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages"

export const runtime = "nodejs"

const systemPrompt = `คุณเป็นระบบสร้าง Template เอกสาร

งานของคุณ:
1. อ่านเอกสารต้นแบบที่ได้รับ
2. คัดลอกเนื้อหาทั้งหมดออกมา "เหมือนกันทุกตัวอักษร" แต่แทนที่เฉพาะค่าที่เปลี่ยนได้ด้วย {{key}}
3. ห้ามเปลี่ยนรูปแบบ ลำดับ หรือเนื้อหาอื่นใด — คัดลอกทุกอย่างไว้ตามเดิม

ค่าที่เปลี่ยนได้ คือ: ชื่อบุคคล/บริษัท, วันที่, เลขที่เอกสาร, จำนวนเงิน, ที่อยู่, ตำแหน่ง, รายละเอียดเฉพาะ
ค่าที่ไม่ควรเปลี่ยน คือ: คำขึ้นต้น/ลงท้ายแบบมาตรฐาน, หัวกระดาษบริษัท (ถ้าเป็นข้อมูลบริษัทเจ้าของ), คำที่ปรากฏในทุกฉบับ

ตัวอย่าง:
เอกสารจริง: "เรียน บริษัท ABC จำกัด ขอแจ้งราคา จำนวน 10,000 บาท วันที่ 1 มกราคม 2568"
template_content: "เรียน {{recipientName}} ขอแจ้งราคา จำนวน {{amount}} บาท วันที่ {{date}}"

ตอบเป็น JSON เท่านั้น (ไม่มี markdown):
{
  "name": "ชื่อเอกสาร (ภาษาไทย)",
  "category": "sales|hr|finance|government|legal|general",
  "folder": "ชื่อ Folder ภาษาไทย เช่น งานขาย, HR, ราชการ",
  "template_content": "เนื้อหาเอกสารทั้งหมด คงรูปแบบเดิม ใส่ {{key}} ตรงค่าที่เปลี่ยนได้",
  "variables": [
    {"key": "recipientName", "label": "ชื่อผู้รับ", "value": "บริษัท ABC จำกัด"},
    {"key": "amount", "label": "จำนวนเงิน", "value": "10,000"},
    {"key": "date", "label": "วันที่", "value": "1 มกราคม 2568"}
  ]
}`

function parseResponse(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  const parsed = JSON.parse(match[0])
  return {
    name: parsed.name ?? "",
    category: parsed.category ?? "general",
    folder: parsed.folder ?? parsed.category ?? "ทั่วไป",
    template_content: parsed.template_content ?? "",
    variables: (parsed.variables ?? []).map((v: Record<string, unknown>) => ({
      key: v.key,
      label: v.label,
      value: v.value ?? "",
    })),
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
      { type: "text" as const, text: `${docHeader}เนื้อหาเอกสาร:\n${text.slice(0, 8000)}\n\nสร้าง Template โดยคงเนื้อหาทั้งหมดไว้ แค่ระบุ {{key}} ตรงค่าที่เปลี่ยนได้` },
    ]
  } else {
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")

    if (isPdf) {
      const b64 = buffer.toString("base64")
      messageContent = [
        {
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: b64 },
        },
        { type: "text" as const, text: "สร้าง Template โดยคงเนื้อหาทั้งหมดไว้ แค่ระบุ {{key}} ตรงค่าที่เปลี่ยนได้" },
      ]
    } else {
      let textContent = ""
      try {
        const mammoth = await import("mammoth")
        const result = await mammoth.convertToHtml({ buffer })
        textContent = result.value
      } catch {
        textContent = buffer.toString("utf-8").slice(0, 8000)
      }
      messageContent = [
        { type: "text" as const, text: `เนื้อหาเอกสาร (HTML):\n${textContent.slice(0, 8000)}\n\nสร้าง Template โดยคงรูปแบบ HTML ไว้ทั้งหมด แค่ระบุ {{key}} ตรงค่าที่เปลี่ยนได้` },
      ]
    }
  }

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
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
