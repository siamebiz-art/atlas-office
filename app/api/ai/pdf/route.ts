import { NextRequest, NextResponse } from "next/server"
import { getOpenAI, GPT_MODEL } from "@/lib/openai"
import { createServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { fileId, question, history = [] } = await req.json()

  const supabase = createServerClient()
  const { data: file } = await supabase.from("files").select("name,public_url,ai_summary").eq("id", fileId).single()
  if (!file) return NextResponse.json({ answer: "ไม่พบไฟล์" }, { status: 404 })

  const client = getOpenAI()

  const systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์เอกสาร PDF ชื่อ "${file.name}".
${file.ai_summary ? `สรุปเนื้อหาเบื้องต้น: ${file.ai_summary}` : ""}
ตอบคำถามอย่างตรงประเด็น ชัดเจน และเป็นประโยชน์ ถ้าไม่มีข้อมูลให้บอกตามตรง`

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: question },
  ]

  const res = await client.chat.completions.create({
    model: GPT_MODEL,
    max_tokens: 1024,
    messages,
  })

  const answer = res.choices[0]?.message?.content ?? "ขออภัย ไม่สามารถตอบได้ในขณะนี้"
  return NextResponse.json({ answer })
}
