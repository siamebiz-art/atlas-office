import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import mammoth from "mammoth"
import { createServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

const SYSTEM = `You are ATLAS Document Intelligence™. Analyze the uploaded document and create a Smart Template from it.

Return ONLY valid JSON (no markdown fences, no explanation):
{
  "title": "ชื่อ Template ภาษาไทย",
  "category": "หมวดหมู่ เช่น สัญญา ใบเสนอราคา รายงาน บันทึก ฯลฯ",
  "description": "คำอธิบายสั้นๆ ว่า template นี้ใช้ทำอะไร (ไม่เกิน 80 ตัวอักษร)",
  "doc_type": "quotation|invoice|receipt|contract|report|memo|letter|proposal|general",
  "fields": [
    {"label": "ชื่อลูกค้า", "key": "customer_name", "type": "text", "required": true},
    {"label": "วันที่", "key": "date", "type": "date", "required": true}
  ],
  "template_content": "# {{title}}\n\nวันที่: {{date}}\n\nเรียน: {{customer_name}}\n\n..."
}

Rules:
- fields: extract 3-8 variable fields that users would need to fill in
- template_content: full template in Thai markdown with {{field_key}} placeholders for each field
- Be thorough — recreate the full document structure as a reusable template`

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (!["pdf", "docx", "doc"].includes(ext)) {
    return NextResponse.json({ error: "รองรับเฉพาะ PDF และ DOCX" }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  let response: Anthropic.Message

  if (ext === "pdf") {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
          } as Anthropic.DocumentBlockParam,
          { type: "text", text: `ชื่อไฟล์: ${file.name}\nวิเคราะห์และสร้าง Smart Template` },
        ],
      }],
    })
  } else {
    const { value: text } = await mammoth.extractRawText({ buffer })
    if (!text.trim()) {
      return NextResponse.json({ error: "ไม่พบเนื้อหาในไฟล์" }, { status: 400 })
    }
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `ชื่อไฟล์: ${file.name}\n\nเนื้อหาเอกสาร:\n${text.slice(0, 8000)}\n\nวิเคราะห์และสร้าง Smart Template`,
      }],
    })
  }

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : ""
  const json = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()

  let parsed: {
    title: string; category: string; description: string; doc_type: string
    fields: { label: string; key: string; type: string; required: boolean }[]
    template_content: string
  }
  try {
    parsed = JSON.parse(json)
  } catch {
    return NextResponse.json({ error: "AI ไม่สามารถวิเคราะห์ไฟล์นี้ได้ กรุณาลองใหม่" }, { status: 500 })
  }

  const content = JSON.stringify({
    category: parsed.category ?? "ทั่วไป",
    description: parsed.description ?? "",
    fields: parsed.fields ?? [],
    template_content: parsed.template_content ?? "",
    source_file: file.name,
    doc_type: parsed.doc_type ?? "general",
  })

  const { data, error } = await supabase.from("documents").insert({
    user_id: user.id,
    title: parsed.title || file.name.replace(/\.[^.]+$/, ""),
    content,
    doc_type: "smart_template",
    language: "th",
    tags: ["smart_template", parsed.category ?? "ทั่วไป", parsed.doc_type ?? "general"],
    word_count: parsed.template_content?.length ?? 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, title: data.title, category: parsed.category })
}
