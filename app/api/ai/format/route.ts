import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"

export const runtime = "nodejs"

const SYSTEM_PROMPTS: Record<string, string> = {
  improve:      "ปรับปรุงข้อความ HTML ด้านล่างให้ดีขึ้น ชัดเจนขึ้น และน่าอ่านขึ้น คงรูปแบบ HTML tags เดิมทั้งหมด ตอบเฉพาะ HTML ที่ปรับแล้ว ไม่ต้องอธิบาย",
  rewrite:      "เขียนข้อความ HTML ด้านล่างใหม่ด้วยคำและโครงสร้างที่แตกต่างแต่ความหมายเดิม คงรูปแบบ HTML tags ตอบเฉพาะ HTML",
  summarize:    "สรุปข้อความ HTML ด้านล่างให้กระชับเป็นประเด็นสำคัญ ใช้ <ul><li> สำหรับรายการ คงรูปแบบ HTML ตอบเฉพาะ HTML",
  translate:    "แปลข้อความ HTML ด้านล่าง: หากเป็นภาษาไทยให้แปลเป็นอังกฤษ หากเป็นอังกฤษให้แปลเป็นไทย คงรูปแบบ HTML tags ทั้งหมด ตอบเฉพาะ HTML",
  professional: "ปรับโทนข้อความ HTML ด้านล่างให้เป็นทางการและเป็นมืออาชีพมากขึ้น ใช้ภาษาสุภาพ เป็นทางการ คงรูปแบบ HTML ตอบเฉพาะ HTML",
  shorter:      "ย่อข้อความ HTML ด้านล่างให้สั้นลงและกระชับขึ้น คงเนื้อหาสำคัญไว้ คงรูปแบบ HTML ตอบเฉพาะ HTML",
  longer:       "ขยายข้อความ HTML ด้านล่างให้ยาวขึ้นโดยเพิ่มรายละเอียด ตัวอย่าง และคำอธิบายเพิ่มเติม คงรูปแบบ HTML ตอบเฉพาะ HTML",
}

export async function POST(req: NextRequest) {
  const { action, text } = await req.json()
  if (!action || !text) return NextResponse.json({ error: "missing" }, { status: 400 })

  const systemPrompt = SYSTEM_PROMPTS[action] ?? SYSTEM_PROMPTS.improve
  const client = getAnthropic()

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
  })

  const result = msg.content[0].type === "text" ? msg.content[0].text.trim() : ""
  return NextResponse.json({ result })
}
