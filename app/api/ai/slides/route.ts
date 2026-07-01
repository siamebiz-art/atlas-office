import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { parseJsonSafe } from "@/lib/utils"
import type { SlideItem } from "@/types"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { prompt, slideCount = 10, existingTitle } = await req.json()

  const client = getAnthropic()
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: `คุณเป็นผู้เชี่ยวชาญการสร้าง Presentation สร้างสไลด์ ${slideCount} หน้า
ตอบกลับ ONLY valid JSON (no markdown, no explanation):

{
  "title": "ชื่อ Presentation",
  "slides": [
    {
      "id": "1",
      "title": "Slide Title",
      "layout": "cover",
      "content": { "headline": "หัวข้อ", "subtitle": "หัวข้อรอง" },
      "imageKeyword": "water drink healthy",
      "imageSeed": 1,
      "speakerNotes": ""
    }
  ]
}

Layouts:
- "cover"     → หน้าแรก (headline + subtitle)
- "content"   → เนื้อหา + bullets (bullets = array of strings)
- "two-column"→ สองคอลัมน์ (leftContent + rightContent)
- "image"     → full-image slide (headline + subtitle บน image)
- "closing"   → สรุป/ขอบคุณ (headline + subtitle)

imageKeyword rules:
- ทุก slide ควรมี imageKeyword เป็น 1-3 คำภาษาอังกฤษ ที่เกี่ยวข้องกับเนื้อหา
- ใช้คำที่ให้ผลดีบน Unsplash เช่น "water health", "business meeting", "technology computer"
- imageSeed ให้ตั้งแต่ 1 เพิ่มขึ้นทีละ 1 แต่ละ slide

${existingTitle ? `Presentation นี้ชื่อ: ${existingTitle}` : ""}`,
    messages: [{ role: "user", content: prompt }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""
  const parsed = parseJsonSafe<{ title?: string; slides?: SlideItem[] }>(text, {})

  // Ensure imageSeed is set on every slide
  const slides = (parsed.slides ?? []).map((s, i) => ({
    ...s,
    imageSeed: s.imageSeed ?? i + 1,
  }))

  return NextResponse.json({
    title: parsed.title ?? prompt.slice(0, 60),
    slides,
  })
}
