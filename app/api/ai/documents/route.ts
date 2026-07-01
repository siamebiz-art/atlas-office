import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { createServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

const docTypeLabels: Record<string, string> = {
  report: "รายงาน", proposal: "Proposal", quotation: "ใบเสนอราคา",
  invoice: "ใบแจ้งหนี้", contract: "สัญญา", "meeting-notes": "บันทึกการประชุม",
  sop: "SOP", resume: "Resume", "cover-letter": "Cover Letter",
  "business-plan": "Business Plan", "marketing-plan": "Marketing Plan", general: "เอกสาร",
}

async function getKnowledgeContext(userId: string) {
  const supabase = createServerClient()
  const { data } = await supabase.from("knowledge_items").select("key,value").eq("user_id", userId)
  if (!data?.length) return ""
  return "ข้อมูลบริษัท:\n" + data.map(k => `${k.key}: ${k.value}`).join("\n")
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { prompt, content, action, instruction, docType = "general", language = "th" } = body

  const supabase = createServerClient()
  const authHeader = req.headers.get("cookie") ?? ""

  let userId = ""
  try {
    const { data: { user } } = await (await import("@supabase/ssr")).createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    ).auth.getUser()
    userId = user?.id ?? ""
  } catch { /* no user */ }

  const knowledgeCtx = userId ? await getKnowledgeContext(userId) : ""
  const client = getAnthropic()

  let systemPrompt = ""
  let userMessage = ""

  if (action === "generate") {
    systemPrompt = `คุณเป็นนักเขียนมืออาชีพ สร้าง${docTypeLabels[docType] ?? "เอกสาร"}ที่สมบูรณ์เป็นภาษา${language === "th" ? "ไทย" : language === "en" ? "อังกฤษ" : language === "zh" ? "จีน" : "ญี่ปุ่น"}.
${knowledgeCtx}
ใช้ HTML tags เพื่อจัดรูปแบบ: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <table>, <tr>, <td>, <th>
ตอบกลับใน JSON format: {"title": "...", "content": "<html content here>"}`
    userMessage = prompt ?? ""
  } else if (action === "rewrite") {
    systemPrompt = "เขียนเนื้อหาด้านล่างใหม่ให้ดีขึ้น ชัดเจนขึ้น และเป็นมืออาชีพมากขึ้น คงรูปแบบ HTML เดิม ตอบกลับใน JSON: {\"content\": \"<rewritten html>\"}"
    userMessage = content ?? ""
  } else if (action === "summarize") {
    systemPrompt = "สรุปเนื้อหาด้านล่างเป็นประเด็นสำคัญ ใช้ <ul><li> ตอบกลับใน JSON: {\"content\": \"<html summary>\"}"
    userMessage = content ?? ""
  } else if (action === "translate") {
    const targetLang = language === "th" ? "ไทย" : language === "en" ? "อังกฤษ" : language === "zh" ? "จีน" : "ญี่ปุ่น"
    systemPrompt = `แปลเนื้อหาด้านล่างเป็นภาษา${targetLang} คงรูปแบบ HTML เดิม ตอบกลับใน JSON: {"content": "<translated html>"}`
    userMessage = content ?? ""
  } else if (action === "tone-formal") {
    systemPrompt = "ปรับโทนภาษาของเนื้อหาด้านล่างให้เป็นทางการ คงรูปแบบ HTML เดิม ตอบกลับใน JSON: {\"content\": \"<html>\"}"
    userMessage = content ?? ""
  } else if (action === "tone-casual") {
    systemPrompt = "ปรับโทนภาษาของเนื้อหาด้านล่างให้เป็นกันเองมากขึ้น คงรูปแบบ HTML เดิม ตอบกลับใน JSON: {\"content\": \"<html>\"}"
    userMessage = content ?? ""
  } else if (action === "instruct") {
    systemPrompt = `คุณเป็น AI ผู้ช่วยแก้ไขเอกสาร HTML มืออาชีพ
ผู้ใช้จะให้เอกสาร HTML พร้อมคำสั่ง — ให้ดำเนินการตามคำสั่งนั้น

กฎสำคัญ:
- "message" = ข้อความแจ้งผู้ใช้ในแชท (ภาษาไทย กระชับ เช่น "แก้ไขไวยากรณ์เรียบร้อยแล้ว" หรือ "ไม่พบข้อผิดพลาด")
- "content" = HTML เอกสารที่แก้ไขแล้วเท่านั้น ห้ามใส่คำอธิบายหรือข้อความวิเคราะห์ลงใน content
- ถ้าคำสั่งเป็นการแก้ไข → ส่ง HTML ที่แก้แล้วทั้งหมดครบทุกส่วน ห้ามตัดทอน
- ถ้าคำสั่งเป็นคำถาม/วิเคราะห์เฉยๆ → "content" ให้เป็น null
- คง HTML tags โครงสร้างเดิมทั้งหมด

ตอบกลับใน JSON: {"message": "ข้อความแจ้งในแชท", "content": "<html ครบทุกส่วน>" หรือ null}`
    userMessage = `เอกสาร:\n${content ?? ""}\n\nคำสั่ง: ${instruction ?? ""}`
  }

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: action === "instruct" ? 16000 : 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return NextResponse.json({
        content: parsed.content ?? null,
        title: parsed.title ?? "",
        message: parsed.message ?? "",
      })
    }
  } catch { /* fall through */ }

  return NextResponse.json({ content: null, title: "", message: text })
}
