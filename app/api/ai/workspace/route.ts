import { NextRequest, NextResponse } from "next/server"
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { parseJsonSafe } from "@/lib/utils"
import type { WorkspaceIntent } from "@/types"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  const client = getAnthropic()
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 256,
    system: `You are ATLAS Office™ AI assistant. Detect what the user wants to create from their input.
Return ONLY valid JSON (no markdown): {"module":"documents"|"sheets"|"slides"|"pdf"|"files"|"search"|"knowledge"|"automation","docType":"report"|"proposal"|"quotation"|"invoice"|"contract"|"meeting-notes"|"sop"|"resume"|"cover-letter"|"business-plan"|"marketing-plan"|"general","prompt":"<cleaned prompt in original language>","language":"th"|"en"}
Examples:
- "สร้างใบเสนอราคา" → {"module":"documents","docType":"quotation","prompt":"สร้างใบเสนอราคา","language":"th"}
- "ทำงบประมาณร้านกาแฟ" → {"module":"sheets","docType":"budget","prompt":"ทำงบประมาณร้านกาแฟ","language":"th"}
- "create pitch deck startup" → {"module":"slides","docType":"general","prompt":"create pitch deck startup","language":"en"}`,
    messages: [{ role: "user", content: prompt }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""
  const intent = parseJsonSafe<WorkspaceIntent>(text, {
    module: "documents",
    docType: "general",
    prompt,
    language: "th",
  })

  return NextResponse.json(intent)
}
