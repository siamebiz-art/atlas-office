"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, Presentation } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import AILoadingDots from "@/components/shared/AILoadingDots"
import type { Presentation as Pres } from "@/types"

function SlidesPage() {
  const [slides, setSlides] = useState<Pres[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("presentations").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
    setSlides(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const prompt = searchParams.get("prompt")
    if (prompt) createWithAI(prompt)
  }, [])

  async function createWithAI(prompt: string) {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch("/api/ai/slides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, slideCount: 10 }) })
    const { slides: generatedSlides, title } = await res.json()
    const { data } = await supabase.from("presentations").insert({ user_id: user.id, title: title || prompt.slice(0, 60), slides: generatedSlides, theme: "dark" }).select().single()
    if (data) router.push(`/slides/${data.id}`)
    setCreating(false)
  }

  async function createBlank() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("presentations").insert({
      user_id: user.id, title: "Presentation ใหม่", theme: "dark",
      slides: [{ id: "1", title: "Slide 1", layout: "cover", content: { headline: "หัวข้อหลัก", subtitle: "หัวข้อรอง" }, speakerNotes: "" }],
    }).select().single()
    if (data) router.push(`/slides/${data.id}`)
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--tx-main)" }}>AI Slides</h2>
          <p style={{ color: "var(--tx-dim)", fontSize: 14 }}>สร้าง Presentation จากข้อความด้วย AI</p>
        </div>
        <button onClick={createBlank} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <Plus size={15} />
          สร้าง Presentation
        </button>
      </div>

      {creating && <div style={{ marginBottom: 24 }}><AILoadingDots label="AI กำลังสร้าง Slides…" /></div>}

      {!loading && slides.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <Presentation size={48} color="var(--tx-faint)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--tx-muted)", marginBottom: 8 }}>ยังไม่มี Presentation</h3>
          <button onClick={createBlank} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, cursor: "pointer" }}>+ สร้าง Presentation</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {slides.map(p => (
            <div
              key={p.id}
              onClick={() => router.push(`/slides/${p.id}`)}
              style={{ background: "var(--bg-main)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 16, padding: 20, cursor: "pointer", transition: ".2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,158,11,0.12)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.18)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Presentation size={16} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-primary)" }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "var(--tx-faint)" }}>{p.slides?.length ?? 0} slides</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--tx-faint)" }}>{formatDate(p.updated_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SlidesPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--tx-dim)" }}>กำลังโหลด…</div>}>
      <SlidesPage />
    </Suspense>
  )
}
