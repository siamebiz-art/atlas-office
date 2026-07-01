"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import SheetGrid from "@/components/sheets/SheetGrid"
import AISheetToolbar from "@/components/sheets/AISheetToolbar"
import type { Sheet, SheetData } from "@/types"

export default function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [data, setData] = useState<SheetData>({ headers: [], rows: [] })
  const [title, setTitle] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from("sheets").select("*").eq("id", id).single().then(({ data: s }) => {
      if (s) { setSheet(s); setData(s.data); setTitle(s.title) }
    })
  }, [id])

  const save = useCallback(async (d = data, t = title) => {
    await supabase.from("sheets").update({ data: d, title: t, updated_at: new Date().toISOString() }).eq("id", id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [id, data, title])

  async function handleAIAction(action: string) {
    setAiLoading(true)
    const prompt = action === "fill" ? `เติมข้อมูลตัวอย่างที่สมเหตุสมผลลงในตาราง ${title}` : action === "formula" ? `แนะนำสูตรคำนวณสำหรับตาราง ${title}` : `แนะนำการแสดงผล chart สำหรับตาราง ${title}`
    const res = await fetch("/api/ai/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, currentData: data }) })
    const { data: newData } = await res.json()
    if (newData) { setData(newData); save(newData, title) }
    setAiLoading(false)
  }

  if (!sheet) return <div style={{ padding: 40, color: "var(--tx-dim)" }}>กำลังโหลด…</div>

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => router.push("/sheets")} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-icon)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={15} />
        </button>
        <input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => save()} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "var(--tx-main)" }} />
        <button onClick={() => save()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: saved ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"}`, borderRadius: 10, color: "#34d399", fontSize: 13, cursor: "pointer" }}>
          {saved ? <CheckCircle size={13} /> : <Save size={13} />}
          {saved ? "บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AISheetToolbar onAction={handleAIAction} loading={aiLoading} />
      </div>

      <div style={{ background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 16, padding: 16, overflowX: "auto" }}>
        <SheetGrid data={data} onChange={d => { setData(d); save(d, title) }} />
      </div>
    </div>
  )
}
