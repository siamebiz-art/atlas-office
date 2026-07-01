"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Sparkles, Search, Upload } from "lucide-react"
import { useLang } from "@/contexts/LanguageContext"

type TemplateHit = { id: string; name: string; icon: string }

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
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setInput(""); setHit(null); setTimeout(() => inputRef.current?.focus(), 80) }
  }, [open])

  useEffect(() => {
    setHit(detectTemplate(input))
  }, [input])

  function go(href: string) { router.push(href); onClose() }

  function handleOption(opt: typeof CREATE_OPTIONS[0]) {
    if (opt.upload) { fileRef.current?.click(); return }
    go(opt.href)
  }

  async function handleUpload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase()
    const isPdf = ext === "pdf"
    const dest = isPdf ? "/pdf" : "/documents"

    // Store file metadata so destination page can show upload UI
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingUploadName", file.name)
      sessionStorage.setItem("pendingUploadType", ext ?? "")
    }

    // Convert file to base64 and store for destination page
    const reader = new FileReader()
    reader.onload = () => {
      try { sessionStorage.setItem("pendingUploadData", reader.result as string) } catch {}
      router.push(dest)
      onClose()
    }
    reader.readAsDataURL(file)
  }

  function handleGenerate() {
    if (hit) { go(`/templates?open=${hit.id}`); return }
    if (input.trim()) {
      go(`/documents?prompt=${encodeURIComponent(input)}&type=general`)
    }
  }

  if (!open) return null

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 22, width: "100%", maxWidth: 520, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>

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
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { handleUpload(f); e.target.value = "" } }} />
    </div>
  )
}
