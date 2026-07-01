import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase.from("files").select("*").order("created_at", { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient()
  const { id, storagePath } = await req.json()
  if (storagePath) await supabase.storage.from("atlas-files").remove([storagePath])
  await supabase.from("files").delete().eq("id", id)
  return NextResponse.json({ success: true })
}
