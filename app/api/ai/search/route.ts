import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { createServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  const supabase = createServerClient()

  const [docs, sheets, slides] = await Promise.all([
    supabase.from("documents").select("id,title,content,doc_type,updated_at").limit(100),
    supabase.from("sheets").select("id,title,sheet_type,updated_at").limit(50),
    supabase.from("presentations").select("id,title,updated_at").limit(50),
  ])

  const allItems = [
    ...(docs.data ?? []).map(d => ({ id: d.id, title: d.title, type: "document", href: `/workspace/documents/${d.id}`, snippet: d.content?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "" })),
    ...(sheets.data ?? []).map(s => ({ id: s.id, title: s.title, type: "sheet", href: `/workspace/sheets/${s.id}`, snippet: s.sheet_type })),
    ...(slides.data ?? []).map(p => ({ id: p.id, title: p.title, type: "slide", href: `/workspace/slides/${p.id}`, snippet: "Presentation" })),
  ]

  if (!allItems.length) return NextResponse.json({ results: [] })

  const client = getAnthropic()
  const catalog = allItems.map((item, i) => `[${i}] ${item.type}: "${item.title}" — ${item.snippet?.slice(0, 100)}`).join("\n")

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: `คุณเป็น AI ค้นหาเอกสาร วิเคราะห์คำถามของผู้ใช้และหารายการที่ตรงกับความต้องการที่สุดจากรายการต่อไปนี้
รายการ:
${catalog}

ตอบกลับเป็น JSON array ของ index ที่ตรงกัน เรียงจากเกี่ยวข้องมากไปน้อย สูงสุด 8 รายการ: [0, 5, 2, ...]
ถ้าไม่มีที่ตรงกัน ตอบ []`,
    messages: [{ role: "user", content: `ค้นหา: ${query}` }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : "[]"
  let indices: number[] = []
  try {
    const match = text.match(/\[[\d,\s]*\]/)
    if (match) indices = JSON.parse(match[0])
  } catch { indices = [] }

  const results = indices.filter(i => i >= 0 && i < allItems.length).map(i => allItems[i])
  return NextResponse.json({ results })
}
