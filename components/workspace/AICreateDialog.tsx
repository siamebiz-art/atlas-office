"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Sparkles, Search, ArrowLeft, FileText, Loader2 } from "lucide-react"
import { useLang } from "@/contexts/LanguageContext"

type TemplateHit = { id: string; name: string; icon: string }
type UploadState = "idle" | "preview" | "analyzing" | "saving" | "done" | "error"

// Client-side keyword detection (no API call)
const DETECT_MAP: { id: string; name: string; icon: string; kw: string[] }[] = [
  { id: "quotation",           name: "ใบเสนอราคา",           icon: "📄", kw: ["ใบเสนอราคา","เสนอราคา","quotation","ราคา"] },
  { id: "invoice",             name: "ใบแจ้งหนี้",           icon: "🧾", kw: ["ใบแจ้งหนี้","invoice","วางบิล","แจ้งหนี้"] },
  { id: "receipt",             name: "ใบเสร็จรับเงิน",       icon: "🧾", kw: ["ใบเสร็จ","receipt","เสร็จรับเงิน"] },
  { id: "purchase-order",      name: "ใบสั่งซื้อ",           icon: "🛒", kw: ["ใบสั่งซื้อ","สั่งซื้อ","purchase order","po"] },
  { id: "sales-report",        name: "รายงานการขาย",         icon: "📊", kw: ["รายงานการขาย","sales report","ยอดขาย"] },
  { id: "employment-contract", name: "สัญญาจ้างงาน",         icon: "📋", kw: ["สัญญาจ้าง","จ้างงาน","employment contract"] },
  { id: "employment-cert",     name: "หนังสือรับรองทำงาน",   icon: "🏆", kw: ["รับรอง","certificate","หนังสือรับรอง"] },
  { id: "leave-request",       name: "ใบลาหยุดงาน",          icon: "📅", kw: ["ใบลา","ลาหยุด","leave","ลากิจ","ลาป่วย","ลาพักร้อน"] },
  { id: "job-offer",           name: "หนังสือเสนองาน",       icon: "🎯", kw: ["เสนองาน","job offer","offer letter"] },
  { id: "warning-letter",      name: "หนังสือเตือน",         icon: "⚠️", kw: ["หนังสือเตือน","warning","เตือน"] },
  { id: "resignation",         name: "ใบลาออก",              icon: "📨", kw: ["ลาออก","resignation","ลาออกจาก"] },
  { id: "training-plan",       name: "แผนฝึกอบรม",           icon: "📚", kw: ["ฝึกอบรม","training","อบรม"] },
  { id: "internal-memo",       name: "บันทึกข้อความ",        icon: "📝", kw: ["บันทึกข้อความ","memo","บันทึก","หนังสือภายใน"] },
  { id: "external-letter",     name: "หนังสือภายนอก",        icon: "📬", kw: ["หนังสือภายนอก","external letter"] },
  { id: "meeting-minutes",     name: "รายงานการประชุม",      icon: "🎤", kw: ["รายงานการประชุม","minutes","ประชุม","meeting"] },
  { id: "meeting-agenda",      name: "ระเบียบวาระประชุม",    icon: "📌", kw: ["วาระ","agenda"] },
  { id: "announcement",        name: "ประกาศ",                icon: "📢", kw: ["ประกาศ","announcement"] },
  { id: "nda",                 name: "สัญญาห้ามเปิดเผย",     icon: "🔒", kw: ["nda","ห้ามเปิดเผย","ความลับ","non-disclosure"] },
  { id: "service-agreement",   name: "สัญญาให้บริการ",       icon: "🤝", kw: ["สัญญาให้บริการ","service agreement","สัญญาบริการ"] },
  { id: "lease",               name: "สัญญาเช่า",            icon: "🏠", kw: ["สัญญาเช่า","lease","เช่า"] },
  { id: "mou",                 name: "บันทึกความเข้าใจ",     icon: "📜", kw: ["mou","ความเข้าใจ","ความร่วมมือ"] },
  { id: "consignment",         name: "สัญญาฝากขาย",         icon: "📦", kw: ["ฝากขาย","consignment"] },
  { id: "expense-report",      name: "รายงานค่าใช้จ่าย",    icon: "💰", kw: ["ค่าใช้จ่าย","expense","เบิกค่า","เบิกเงิน"] },
  { id: "budget-proposal",     name: "แผนงบประมาณ",         icon: "📈", kw: ["งบประมาณ","budget","แผนงบ"] },
  { id: "payment-voucher",     name: "ใบสำคัญจ่าย",         icon: "💸", kw: ["ใบสำคัญ","voucher","สำคัญจ่าย"] },
  { id: "cash-flow",           name: "กระแสเงินสด",         icon: "💹", kw: ["กระแสเงินสด","cash flow"] },
  { id: "project-proposal",    name: "ข้อเสนอโครงการ",      icon: "🚀", kw: ["ข้อเสนอโครงการ","proposal","โครงการ"] },
  { id: "business-plan",       name: "แผนธุรกิจ",           icon: "💼", kw: ["แผนธุรกิจ","business plan"] },
  { id: "status-report",       name: "รายงานความคืบหน้า",   icon: "📊", kw: ["ความคืบหน้า","status report","progress"] },
  { id: "press-release",       name: "ข่าวประชาสัมพันธ์",   icon: "📰", kw: ["ประชาสัมพันธ์","press release","ข่าวประชาสัมพันธ์"] },
  { id: "risk-report",         name: "รายงานความเสี่ยง",    icon: "⚠️", kw: ["ความเสี่ยง","risk","ประเมินความเสี่ยง"] },
  { id: "handover",            name: "บันทึกส่งมอบงาน",     icon: "🔄", kw: ["ส่งมอบ","handover","ส่งมอบงาน"] },
  { id: "recommendation",      name: "หนังสือแนะนำตัว",     icon: "⭐", kw: ["แนะนำตัว","recommendation","รับรองบุคคล"] },
]

function detectTemplate(input: string): TemplateHit | null {
  const q = input.toLowerCase().trim()
  if (q.length < 2) return null
  for (const t of DETECT_MAP) {
    for (const kw of t.kw) {
      if (q.includes(kw.toLowerCase()) || kw.toLowerCase().includes(q)) {
        return { id: t.id, name: t.name, icon: t.icon }
      }
    }
  }
  return null
}

const CREATE_OPTIONS = [
  { icon: "📄", labelTh: "เอกสาร",       labelEn: "Document",      descTh: "รายงาน Proposal สัญญา",  descEn: "Reports, Proposals, Contracts", href: "/documents",    color: "#6366f1" },
  { icon: "📊", labelTh: "ตาราง",        labelEn: "Spreadsheet",   descTh: "Budget KPI ตารางข้อมูล", descEn: "Budget, KPI, Data tables",      href: "/sheets",       color: "#10b981" },
  { icon: "📽", labelTh: "สไลด์",        labelEn: "Presentation",  descTh: "Pitch Deck Slides",       descEn: "Pitch Decks, Slides",           href: "/slides",       color: "#f59e0b" },
  { icon: "📑", labelTh: "PDF",           labelEn: "PDF",           descTh: "วิเคราะห์ ถามตอบ สรุป",  descEn: "Analyze, Q&A, Summarize",       href: "/pdf",          color: "#ef4444" },
  { icon: "🧩", labelTh: "จากแม่แบบ",    labelEn: "From Template", descTh: "เลือกจาก 42+ templates",  descEn: "Choose from 42+ templates",     href: "/templates",    color: "#8b5cf6", star: true },
  { icon: "📥", labelTh: "อัปโหลด & เรียนรู้", labelEn: "Upload & Learn", descTh: "AI เรียนรู้จากไฟล์คุณ", descEn: "AI learns from your file",  href: "/templates",    color: "#06b6d4", upload: true },
]

type Props = { open: boolean; onClose: () => void }

export default function AICreateDialog({ open, onClose }: Props) {
  const router = useRouter()
  const { lang } = useLang()
  const [input, setInput] = useState("")
  const [hit, setHit] = useState<TemplateHit | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadError, setUploadError] = useState("")

  // Preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewObjectUrl, setPreviewObjectUrl] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setInput(""); setHit(null)
      setUploadState("idle"); setUploadError("")
      resetPreview()
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => { if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl) }
  }, [previewObjectUrl])

  useEffect(() => {
    setHit(detectTemplate(input))
  }, [input])

  function resetPreview() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
    setSelectedFile(null)
    setPreviewObjectUrl("")
    setPreviewHtml("")
  }

  function go(href: string) { router.push(href); onClose() }

  function handleOption(opt: typeof CREATE_OPTIONS[0]) {
    if (opt.upload) { fileRef.current?.click(); return }
    go(opt.href)
  }

  // Step 1: file selected → show preview, don't analyze yet
  function handleFileSelected(file: File) {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
    const url = URL.createObjectURL(file)
    const pdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")

    setSelectedFile(file)
    setPreviewObjectUrl(url)
    setUploadState("preview")
    setUploadError("")
    setPreviewHtml("")
    setPreviewLoading(!pdf)

    if (!pdf) {
      const form = new FormData()
      form.append("file", file)
      fetch("/api/ai/templates/extract", { method: "POST", body: form })
        .then(res => res.ok ? res.json() : { html: "" })
        .then(data => { setPreviewHtml(data.html ?? ""); setPreviewLoading(false) })
        .catch(() => setPreviewLoading(false))
    }
  }

  // Step 2: user clicks "วิเคราะห์" → run AI
  async function handleAnalyze() {
    if (!selectedFile) return
    setUploadState("analyzing")
    setUploadError("")

    const form = new FormData()
    form.append("file", selectedFile)

    try {
      const analyzeRes = await fetch("/api/ai/templates/analyze", { method: "POST", body: form })
      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({}))
        throw new Error(err.error ?? "วิเคราะห์ไฟล์ไม่ได้")
      }
      const { name, category, variables, folder } = await analyzeRes.json()

      setUploadState("saving")

      const saveRes = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, variables, folder: folder ?? category ?? "ทั่วไป" }),
      })
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}))
        throw new Error(err.error ?? "บันทึก Template ไม่สำเร็จ")
      }

      setUploadState("done")
      setTimeout(() => { router.push("/templates?section=my"); onClose() }, 700)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่")
      setUploadState("preview") // back to preview so user can retry
    }
  }

  function handleGenerate() {
    if (hit) { go(`/templates?open=${hit.id}`); return }
    if (input.trim()) {
      go(`/documents?prompt=${encodeURIComponent(input)}&type=general`)
    }
  }

  if (!open) return null

  const isPdf = !!(selectedFile && (selectedFile.type.includes("pdf") || selectedFile.name.toLowerCase().endsWith(".pdf")))

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 22,
        width: "100%", maxWidth: uploadState === "preview" ? 640 : 520,
        overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", position: "relative",
        transition: "max-width .2s ease",
      }}>

        {/* ── Analyzing / Saving / Done overlay ── */}
        {(uploadState === "analyzing" || uploadState === "saving" || uploadState === "done") && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(7,7,15,0.92)", borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.15))", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {uploadState === "done"
                ? <span style={{ fontSize: 24 }}>✅</span>
                : <Sparkles size={24} color="#a78bfa" style={{ animation: "spin 1.5s linear infinite" }} />}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                {uploadState === "analyzing" && "AI กำลังวิเคราะห์เอกสาร…"}
                {uploadState === "saving" && "กำลังบันทึก Template…"}
                {uploadState === "done" && "สร้าง Template สำเร็จ! ✨"}
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                {uploadState === "analyzing" && "ตรวจจับโครงสร้าง ตัวแปร และหมวดหมู่"}
                {uploadState === "saving" && "เพิ่มเข้า My Templates ของคุณ"}
                {uploadState === "done" && "กำลังพาไปหน้า My Templates…"}
              </div>
            </div>
            {uploadState !== "done" && (
              <div style={{ display: "flex", gap: 5 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Preview state ── */}
        {uploadState === "preview" && selectedFile ? (
          <>
            {/* Preview header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--bg-border)" }}>
              <button
                onClick={() => { setUploadState("idle"); resetPreview() }}
                style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-card-hover)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <ArrowLeft size={14} />
              </button>
              <FileText size={16} color="#06b6d4" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</div>
                <div style={{ fontSize: 11, color: "var(--tx-faint)" }}>
                  {isPdf ? "PDF" : "Word Document"} · {(selectedFile.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-card-hover)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>

            {/* Preview content */}
            <div style={{ height: 420, overflow: "hidden", background: "var(--bg-deep)", position: "relative" }}>
              {isPdf ? (
                <iframe
                  src={previewObjectUrl}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                  title="PDF Preview"
                />
              ) : previewLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--tx-faint)", fontSize: 13 }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  กำลังโหลดเนื้อหา…
                </div>
              ) : previewHtml ? (
                <div
                  style={{ height: "100%", overflowY: "auto", padding: "24px 32px", color: "var(--tx-primary)", fontSize: 14, lineHeight: 1.9, fontFamily: "'Sarabun','TH Sarabun New',sans-serif" }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--tx-faint)" }}>
                  <FileText size={36} color="#334155" />
                  <div style={{ fontSize: 13 }}>ไม่พบข้อความในเอกสาร</div>
                </div>
              )}
            </div>

            {/* Error banner (retry) */}
            {uploadError && (
              <div style={{ margin: "0", padding: "10px 18px", background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <span>⚠️</span>
                {uploadError}
              </div>
            )}

            {/* Action bar */}
            <div style={{ padding: "14px 18px", borderTop: "1px solid var(--bg-border)", display: "flex", gap: 10 }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{ padding: "9px 14px", borderRadius: 10, background: "var(--bg-icon)", border: "1px solid var(--bg-border)", color: "var(--tx-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                เปลี่ยนไฟล์
              </button>
              <button
                onClick={handleAnalyze}
                style={{ flex: 1, padding: "9px 14px", borderRadius: 10, background: "linear-gradient(135deg,#06b6d4,#0891b2)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 16px rgba(6,182,212,0.3)" }}
              >
                <Sparkles size={14} />
                วิเคราะห์และสร้าง Template
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ── Normal dialog content ── */}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 14px", borderBottom: "1px solid var(--bg-border)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, color: "var(--tx-main)", flex: 1 }}>AI Create</span>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-card-hover)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>

            {/* Search / Prompt */}
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} color="var(--tx-faint)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleGenerate(); if (e.key === "Escape") onClose() }}
                  placeholder={lang === "th" ? "พิมพ์สิ่งที่ต้องการ เช่น สร้างใบเสนอราคา…" : "Type what you need, e.g. Create a quotation…"}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "var(--bg-input)", border: "1px solid rgba(99,102,241,0.35)",
                    borderRadius: 12, padding: "11px 14px 11px 36px",
                    color: "var(--tx-primary)", fontSize: 14, outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.65)"}
                  onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.35)"}
                />
              </div>

              {/* Template detection banner */}
              {hit && (
                <div style={{ marginTop: 12, background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22 }}>{hit.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, marginBottom: 2 }}>✓ {lang === "th" ? "พบ Template" : "Template found"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx-primary)" }}>{hit.name}</div>
                  </div>
                  <button
                    onClick={handleGenerate}
                    style={{ padding: "7px 14px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Generate →
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ padding: "14px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "var(--bg-divider)" }} />
                <span style={{ fontSize: 11, color: "var(--tx-faint)", fontWeight: 600 }}>{lang === "th" ? "หรือเลือกประเภท" : "or choose a type"}</span>
                <div style={{ flex: 1, height: 1, background: "var(--bg-divider)" }} />
              </div>
            </div>

            {/* Options Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "12px 20px 20px" }}>
              {CREATE_OPTIONS.map(opt => (
                <button
                  key={opt.labelEn}
                  onClick={() => handleOption(opt)}
                  style={{
                    textAlign: "left", background: `${opt.color}0d`, border: `1px solid ${opt.color}22`,
                    borderRadius: 14, padding: "14px 14px 12px", cursor: "pointer", transition: "all .15s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${opt.color}1e`; e.currentTarget.style.borderColor = `${opt.color}50`; e.currentTarget.style.transform = "translateY(-1px)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${opt.color}0d`; e.currentTarget.style.borderColor = `${opt.color}22`; e.currentTarget.style.transform = "" }}
                >
                  {opt.star && (
                    <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, color: "#a78bfa", background: "rgba(139,92,246,0.15)", padding: "1px 6px", borderRadius: 8 }}>
                      ⭐ {lang === "th" ? "นิยม" : "Popular"}
                    </span>
                  )}
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, color: "var(--tx-primary)", fontSize: 13, marginBottom: 2 }}>{lang === "th" ? opt.labelTh : opt.labelEn}</div>
                  <div style={{ fontSize: 11, color: "var(--tx-faint)", lineHeight: 1.4 }}>{lang === "th" ? opt.descTh : opt.descEn}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { handleFileSelected(f); e.target.value = "" } }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  )
}
