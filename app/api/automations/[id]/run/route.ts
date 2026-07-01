import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"

export const runtime = "nodejs"

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: auto } = await supabase.from("automations").select("*").eq("id", id).single()
  if (!auto) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const results: string[] = []
  const client = getAnthropic()
  let lastContent = ""

  for (const step of (auto.steps ?? [])) {
    if (step.type === "generate-doc") {
      const msg = await client.messages.create({
        model: CLAUDE_MODEL, max_tokens: 2048,
        system: "สร้างเอกสารที่สมบูรณ์ในรูปแบบ HTML",
        messages: [{ role: "user", content: step.config?.prompt ?? "สร้างเอกสาร" }],
      })
      lastContent = msg.content[0].type === "text" ? msg.content[0].text : ""
      results.push(`generate-doc: ${lastContent.length} chars`)
    } else if (step.type === "export-pdf") {
      results.push("export-pdf: simulated")
    } else if (step.type === "save-file") {
      results.push("save-file: simulated")
    } else {
      results.push(`${step.type}: done`)
    }
  }

  await supabase.from("automations").update({ last_run_at: new Date().toISOString() }).eq("id", id)
  return NextResponse.json({ success: true, results })
}
