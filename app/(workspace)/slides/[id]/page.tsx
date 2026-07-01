"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, CheckCircle, Plus, Trash2, Image, RefreshCw, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import SlideCanvas from "@/components/slides/SlideCanvas"
import AILoadingDots from "@/components/shared/AILoadingDots"
import type { Presentation, SlideItem } from "@/types"

function unsplashThumb(keyword: string, seed: number) {
  return `https://source.unsplash.com/320x180/?${encodeURIComponent(keyword)}&sig=${seed}`
}

export default function SlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [pres, setPres] = useState<Presentation | null>(null)
  const [slides, setSlides] = useState<SlideItem[]>([])
  const [active, setActive] = useState(0)
  const [title, setTitle] = useState("")
  const [saved, setSaved] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  useEffect(() => {
    supabase.from("presentations").select("*").eq("id", id).single().then(({ data }) => {
      if (data) { setPres(data); setSlides(data.slides ?? []); setTitle(data.title) }
    })
  }, [id])

  async function save(s = slides, t = title) {
    await supabase.from("presentations").update({ slides: s, title: t, updated_at: new Date().toISOString() }).eq("id", id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function generateMoreSlides() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    const res = await fetch("/api/ai/slides", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: aiPrompt, slideCount: 5, existingTitle: title }),
    })
    const { slides: newSlides } = await res.json()
    const combined = [...slides, ...newSlides]
    setSlides(combined)
    await save(combined, title)
    setAiLoading(false)
    setAiPrompt("")
  }

  function addBlankSlide() {
    const newSlide: SlideItem = {
      id: String(slides.length + 1), title: `Slide ${slides.length + 1}`,
      layout: "content", content: { headline: "", body: "" }, speakerNotes: "",
    }
    const updated = [...slides, newSlide]
    setSlides(updated); setActive(updated.length - 1); save(updated, title)
  }

  function deleteSlide(i: number) {
    if (slides.length <= 1) return
    const updated = slides.filter((_, idx) => idx !== i)
    setSlides(updated); setActive(Math.min(active, updated.length - 1)); save(updated, title)
  }

  function updateSlide(i: number, patch: Partial<SlideItem>) {
    const updated = slides.map((s, idx) => idx !== i ? s : { ...s, ...patch })
    setSlides(updated)
    return updated
  }

  function updateContent(i: number, field: string, value: string) {
    const updated = slides.map((s, idx) => idx !== i ? s : { ...s, content: { ...s.content, [field]: value } })
    setSlides(updated)
  }

  function refreshImage(i: number) {
    const updated = updateSlide(i, { imageSeed: (slides[i].imageSeed ?? 1) + 1 })
    save(updated, title)
  }

  function clearImage(i: number) {
    const updated = updateSlide(i, { imageKeyword: undefined, imageSeed: 1 })
    save(updated, title)
  }

  function setImageKeyword(i: number, kw: string) {
    const updated = updateSlide(i, { imageKeyword: kw || undefined, imageSeed: 1 })
    return updated
  }

  if (!pres) return <div style={{ padding: 40, color: "var(--tx-dim)" }}>กำลังโหลด…</div>
  const current = slides[active]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", margin: "-20px -32px", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-main)", flexShrink: 0 }}>
        <button onClick={() => router.push("/slides")}
          style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-icon)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={14} />
        </button>
        <input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => save()}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, color: "var(--tx-main)" }} />
        <span style={{ fontSize: 12, color: "var(--tx-faint)" }}>{slides.length} slides</span>
        <button onClick={() => save()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: saved ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.1)", border: `1px solid ${saved ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.2)"}`, borderRadius: 8, color: "#fbbf24", fontSize: 12, cursor: "pointer" }}>
          {saved ? <CheckCircle size={12} /> : <Save size={12} />}
          {saved ? "บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>

      {/* ── Main 3-column area ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "210px 1fr 290px", minHeight: 0 }}>

        {/* ── Slide list ── */}
        <div style={{ borderRight: "1px solid var(--bg-border)", overflowY: "auto", padding: 10, background: "var(--bg-deep)" }}>
          {slides.map((s, i) => (
            <div key={s.id} onClick={() => setActive(i)}
              style={{ position: "relative", marginBottom: 8, borderRadius: 9, border: `2px solid ${active === i ? "#f59e0b" : "transparent"}`, overflow: "hidden", cursor: "pointer", transition: "border-color .15s" }}>
              <div style={{ background: "var(--bg-card)", padding: "6px 6px 4px" }}>
                <div style={{ fontSize: 10, color: "var(--tx-faint)", marginBottom: 4, paddingLeft: 2 }}>{i + 1}. {s.title}</div>
                {/* Thumbnail */}
                <div style={{ aspectRatio: "16/9", borderRadius: 5, overflow: "hidden", background: "#1a1a2e", position: "relative" }}>
                  {s.imageKeyword ? (
                    <img
                      src={unsplashThumb(s.imageKeyword, s.imageSeed ?? 1)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: s.imageKeyword ? "rgba(0,0,0,0.35)" : "transparent", fontSize: 9, color: s.imageKeyword ? "#fff" : "var(--tx-dim)", textAlign: "center", padding: 4 }}>
                    {s.content.headline ?? s.title}
                  </div>
                </div>
              </div>
              {s.imageKeyword && (
                <div style={{ position: "absolute", bottom: 8, left: 6, background: "rgba(99,102,241,0.85)", borderRadius: 4, padding: "1px 5px", fontSize: 8, color: "#fff", display: "flex", alignItems: "center", gap: 2 }}>
                  <Image size={7} /> IMG
                </div>
              )}
              {slides.length > 1 && (
                <button onClick={e => { e.stopPropagation(); deleteSlide(i) }}
                  style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: 4, background: "rgba(239,68,68,0.8)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={9} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addBlankSlide}
            style={{ width: "100%", padding: "8px 0", background: "var(--bg-card)", border: "1px dashed var(--bg-border)", borderRadius: 8, color: "var(--tx-faint)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Plus size={11} /> Slide ใหม่
          </button>
        </div>

        {/* ── Canvas ── */}
        <div style={{ background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, overflow: "auto" }}>
          {current && (
            <div style={{ width: "100%", maxWidth: 760 }}>
              <SlideCanvas slide={current} theme={pres.theme} />
            </div>
          )}
        </div>

        {/* ── Edit panel ── */}
        <div style={{ borderLeft: "1px solid var(--bg-border)", overflowY: "auto", padding: 16, background: "var(--bg-main)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-dim)" }}>แก้ไข Slide {active + 1}</div>

          {current && (
            <>
              <div>
                <label style={{ fontSize: 11, color: "var(--tx-dim)", display: "block", marginBottom: 5 }}>หัวข้อหลัก</label>
                <input value={current.content.headline ?? ""} onChange={e => updateContent(active, "headline", e.target.value)} onBlur={() => save()}
                  style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "8px 10px", color: "var(--tx-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              {(current.layout === "cover" || current.layout === "closing" || current.layout === "image") && (
                <div>
                  <label style={{ fontSize: 11, color: "var(--tx-dim)", display: "block", marginBottom: 5 }}>หัวข้อรอง</label>
                  <input value={current.content.subtitle ?? ""} onChange={e => updateContent(active, "subtitle", e.target.value)} onBlur={() => save()}
                    style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "8px 10px", color: "var(--tx-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              )}

              {current.layout === "content" && (
                <div>
                  <label style={{ fontSize: 11, color: "var(--tx-dim)", display: "block", marginBottom: 5 }}>เนื้อหา</label>
                  <textarea value={current.content.body ?? ""} onChange={e => updateContent(active, "body", e.target.value)} onBlur={() => save()} rows={5}
                    style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "8px 10px", color: "var(--tx-primary)", fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              )}

              {/* ── Image Section ── */}
              <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Image size={13} color="#6366f1" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc" }}>ภาพประกอบ Unsplash</span>
                </div>

                {current.imageKeyword && (
                  <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 10, position: "relative", aspectRatio: "16/9", background: "#1a1a2e" }}>
                    <img
                      src={`https://source.unsplash.com/480x270/?${encodeURIComponent(current.imageKeyword)}&sig=${current.imageSeed ?? 1}`}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    />
                    <button onClick={() => clearImage(active)}
                      style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={11} />
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, marginBottom: current.imageKeyword ? 8 : 0 }}>
                  <input
                    value={current.imageKeyword ?? ""}
                    onChange={e => updateSlide(active, { imageKeyword: e.target.value || undefined, imageSeed: 1 })}
                    placeholder="เช่น water health, business office"
                    style={{ flex: 1, background: "var(--bg-input)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "7px 10px", color: "var(--tx-primary)", fontSize: 12, outline: "none" }}
                    onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={e => { save(); e.target.style.borderColor = "rgba(99,102,241,0.2)" }}
                  />
                </div>

                {current.imageKeyword && (
                  <button onClick={() => refreshImage(active)}
                    style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "7px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, color: "#a5b4fc", fontSize: 12, cursor: "pointer", justifyContent: "center" }}>
                    <RefreshCw size={11} /> เปลี่ยนรูปใหม่
                  </button>
                )}

                {!current.imageKeyword && (
                  <p style={{ fontSize: 11, color: "var(--tx-faint)", margin: 0, lineHeight: 1.5 }}>
                    พิมพ์ keyword ภาษาอังกฤษ แล้วกด Enter<br />เช่น "water", "office meeting", "technology"
                  </p>
                )}
              </div>
            </>
          )}

          {/* AI add more slides */}
          <div style={{ marginTop: 4, padding: 14, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24", marginBottom: 8 }}>✨ เพิ่ม Slides ด้วย AI</div>
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateMoreSlides()}
              placeholder="หัวข้อที่ต้องการเพิ่ม…"
              style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "8px 10px", color: "var(--tx-primary)", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <button onClick={generateMoreSlides} disabled={!aiPrompt.trim() || aiLoading}
              style={{ width: "100%", padding: "8px 0", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {aiLoading ? "กำลังสร้าง…" : "สร้าง"}
            </button>
          </div>

          {aiLoading && <AILoadingDots />}
        </div>
      </div>
    </div>
  )
}
