import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Fast text/HTML extraction — no AI, used for document preview before analysis
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")
  if (isPdf) {
    return NextResponse.json({ isPdf: true, html: "", text: "" })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const mammoth = await import("mammoth")
    const result = await mammoth.convertToHtml({ buffer })
    return NextResponse.json({ isPdf: false, html: result.value, text: result.value.replace(/<[^>]+>/g, " ") })
  } catch {
    const text = buffer.toString("utf-8").slice(0, 8000)
    return NextResponse.json({ isPdf: false, html: "", text })
  }
}
