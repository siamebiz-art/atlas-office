import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { createServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

async function getKnowledgeContext(userId: string) {
  const supabase = createServerClient()
  const { data } = await supabase.from("knowledge_items").select("key,value").eq("user_id", userId)
  if (!data?.length) return ""
  return "ข้อมูลบริษัท/ผู้ออกเอกสาร:\n" + data.map(k => `${k.key}: ${k.value}`).join("\n")
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { templateId, templateName, variables, customTemplateHtml } = body as {
    templateId: string
    templateName: string
    variables: Record<string, string>
    customTemplateHtml?: string
  }

  // Get user knowledge context
  let knowledgeCtx = ""
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) knowledgeCtx = await getKnowledgeContext(user.id)
  } catch { /* skip */ }

  const client = getAnthropic()

  // Format variables for Claude
  const varList = Object.entries(variables)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")

  let systemPrompt = ""
  let userMessage = ""

  if (customTemplateHtml) {
    // Fill a custom learned template — replace {{Variable}} placeholders
    let filled = customTemplateHtml
    for (const [key, value] of Object.entries(variables)) {
      filled = filled.replaceAll(`{{${key}}}`, value || `[${key}]`)
    }
    // Polish with Claude
    systemPrompt = `คุณเป็นผู้ช่วยจัดรูปแบบเอกสาร HTML มืออาชีพ
เอกสารด้านล่างมีข้อมูลที่กรอกแล้ว ให้:
1. เติมข้อมูลที่ยังว่างอยู่ (ถ้ามี) ให้สมเหตุสมผล
2. จัดรูปแบบ HTML ให้สวยงาม มีตาราง header footer
3. คง HTML tags เดิมไว้
${knowledgeCtx}
ตอบใน JSON: {"title": "ชื่อเอกสาร", "content": "<html>"}`
    userMessage = `เอกสาร:\n${filled}`
  } else {
    // Generate from scratch using template type + variables
    systemPrompt = `คุณเป็นนักเขียนเอกสารธุรกิจมืออาชีพภาษาไทย

สร้าง${templateName}ที่สมบูรณ์และเป็นมืออาชีพ ใช้ข้อมูลที่ให้มาทั้งหมด
${knowledgeCtx ? `\n${knowledgeCtx}` : ""}

กฎสำคัญ:
- ใช้ HTML tags เพื่อจัดรูปแบบ: <h1> <h2> <p> <table> <tr> <td> <th> <strong> <ul> <li>
- เอกสารต้องครบถ้วนสมบูรณ์ ไม่มีช่องว่างที่ไม่ได้กรอก
- ถ้ามีข้อมูลบริษัทให้ใส่ใน header เอกสาร
- ถ้าไม่มีข้อมูลบางอย่าง ให้ระบุ [กรุณากรอก...] เพื่อให้ผู้ใช้แก้ไขในภายหลัง
- สำหรับตารางราคา ให้แสดงเป็น HTML table ที่ชัดเจน

ตอบใน JSON: {"title": "ชื่อเอกสาร", "content": "<html เอกสารที่สมบูรณ์>"}`

    userMessage = `สร้าง${templateName} (templateId: ${templateId}) ด้วยข้อมูลดังนี้:\n${varList}`
  }

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return NextResponse.json({ content: parsed.content ?? "", title: parsed.title ?? templateName })
    }
  } catch { /* fall through */ }

  return NextResponse.json({ content: text, title: templateName })
}
