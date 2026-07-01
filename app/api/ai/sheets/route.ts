import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { parseJsonSafe } from "@/lib/utils"
import type { SheetData } from "@/types"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { prompt, currentData } = await req.json()

  const client = getAnthropic()
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `คุณเป็น AI ผู้เชี่ยวชาญ Spreadsheet สร้างหรืออัปเดตข้อมูลตาราง
ตอบกลับ ONLY JSON (no markdown): {"title":"ชื่อตาราง","data":{"headers":["คอลัมน์1","คอลัมน์2"],"rows":[["ค่า1","ค่า2"]],"formulas":{"B2":"=A2*0.07"}}}
${currentData ? `ข้อมูลปัจจุบัน: ${JSON.stringify(currentData)}` : ""}`,
    messages: [{ role: "user", content: prompt }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""
  const parsed = parseJsonSafe<{ title?: string; data?: SheetData }>(text, {})

  return NextResponse.json({
    title: parsed.title ?? "",
    data: parsed.data ?? { headers: ["A", "B", "C"], rows: [["", "", ""]] },
  })
}
