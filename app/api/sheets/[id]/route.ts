import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase.from("sheets").select("*").eq("id", id).single()
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  const body = await req.json()
  const { data } = await supabase.from("sheets").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).select().single()
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  await supabase.from("sheets").delete().eq("id", id)
  return NextResponse.json({ success: true })
}
