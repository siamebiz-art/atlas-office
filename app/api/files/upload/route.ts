import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const supabase = createServerClient()

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeName = file.name.replace(/[^a-zA-Z0-9ก-๙.\-_]/g, "_")
  const path = `uploads/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from("atlas-files").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from("atlas-files").getPublicUrl(path)

  let aiSummary: string | null = null
  if (file.type === "application/pdf" && buffer.length < 5 * 1024 * 1024) {
    try {
      const client = getAnthropic()
      const msg = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [{
          role: "user",
          content: `PDF content (base64): ${buffer.toString("base64").slice(0, 1000)}...\n\nสรุปเนื้อหาหลักของเอกสารนี้ใน 2-3 ประโยค`,
        }],
      })
      aiSummary = msg.content[0].type === "text" ? msg.content[0].text : null
    } catch { /* skip summary if fails */ }
  }

  const { data: fileItem } = await supabase.from("files").insert({
    name: file.name,
    file_size: file.size,
    file_type: file.type,
    storage_path: path,
    public_url: publicUrl,
    ai_summary: aiSummary,
  }).select().single()

  return NextResponse.json({ fileItem, publicUrl })
}
