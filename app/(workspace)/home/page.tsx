"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import AICommandBar from "@/components/workspace/AICommandBar"
import RecentFiles from "@/components/workspace/RecentFiles"
import { FileText, Table2, Presentation, FileSearch, FolderOpen, Search, Brain, Zap, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useLang } from "@/contexts/LanguageContext"

const quickActions = [
  { th: "ใบเสนอราคา",    en: "Proposal",      icon: "📄", href: "/documents?prompt=สร้างใบเสนอราคา&type=proposal" },
  { th: "KPI Dashboard", en: "KPI Dashboard", icon: "📊", href: "/sheets?prompt=ทำ KPI Dashboard" },
  { th: "สัญญา",         en: "Contract",      icon: "📑", href: "/documents?prompt=เขียนสัญญา&type=contract" },
  { th: "งบประมาณ",      en: "Budget",        icon: "📈", href: "/sheets?prompt=ทำงบประมาณ" },
  { th: "รายงานประชุม",  en: "Meeting Notes", icon: "🎤", href: "/documents?prompt=ทำ Meeting Minutes&type=meeting-notes" },
  { th: "เรซูเม่",       en: "Resume",        icon: "👤", href: "/documents?prompt=สร้าง Resume&type=resume" },
  { th: "Pitch Deck",    en: "Pitch Deck",    icon: "🎯", href: "/slides?prompt=สร้าง Pitch Deck" },
]

const atlasStatus = {
  th: ["AI Models พร้อมใช้งาน", "Cloud Sync ✓", "แม่แบบพร้อมแล้ว", "ระบบ Export ✓"],
  en: ["AI Models Online",      "Cloud Sync ✓",  "Templates Ready",   "Export Engine ✓"],
}

const modules = [
  { th: "เอกสาร",     en: "Documents",  descTh: "รายงาน Proposal สัญญา",   descEn: "Reports, Proposals, Contracts", href: "/documents", icon: FileText,     color: "#6366f1" },
  { th: "ตาราง",      en: "Sheets",     descTh: "Budget KPI CRM",            descEn: "Budget, KPI, CRM",              href: "/sheets",    icon: Table2,       color: "#10b981" },
  { th: "สไลด์",      en: "Slides",     descTh: "Pitch Deck Presentation",   descEn: "Pitch Deck, Presentations",     href: "/slides",    icon: Presentation, color: "#f59e0b" },
  { th: "PDF",         en: "PDF",        descTh: "สรุป ถามตอบ วิเคราะห์",    descEn: "Summarize, Q&A, Analyze",       href: "/pdf",       icon: FileSearch,   color: "#ef4444" },
  { th: "ไฟล์",       en: "Files",      descTh: "จัดการไฟล์ทั้งหมด",        descEn: "Manage all your files",         href: "/files",     icon: FolderOpen,   color: "#8b5cf6" },
  { th: "ค้นหา",      en: "Search",     descTh: "ค้นหาด้วยภาษาคน",          descEn: "Natural language search",       href: "/search",    icon: Search,       color: "#06b6d4" },
  { th: "คลังความรู้", en: "Knowledge",  descTh: "ข้อมูลบริษัท เทมเพลต",    descEn: "Company info & templates",      href: "/knowledge", icon: Brain,        color: "#ec4899" },
  { th: "อัตโนมัติ",  en: "Automation", descTh: "Workflow อัตโนมัติ",        descEn: "Automated workflows",           href: "/automation",icon: Zap,          color: "#f97316" },
]

const greetingLines: Record<string, { th: string[]; en: string[] }> = {
  morning:   { th: ["วันนี้ดูมีประสิทธิภาพ", "มาสร้างสิ่งยิ่งใหญ่ด้วยกัน", "เริ่มเช้าด้วยความชัดเจน"], en: ["Today looks productive.", "Let's build something great.", "Morning clarity starts here."] },
  afternoon: { th: ["รักษาโมเมนตัมไว้", "ต่อไปสร้างอะไรดี?", "โหมดโฟกัสช่วงบ่าย"],                   en: ["Keep the momentum going.", "What are we creating next?", "Afternoon focus mode."] },
  evening:   { th: ["ทำได้ดีมากวันนี้", "ใกล้ถึงแล้ว — สู้ต่อไป", "เซสชันประสิทธิภาพยามเย็น"],         en: ["Great work today.", "Almost there — keep going.", "Evening productivity session."] },
  night:     { th: ["พร้อมสำหรับพรุ่งนี้แล้วหรือ?", "ทำงานดึก ATLAS อยู่เคียงข้าง", "ไอเดียตอนดึกดีที่สุด"], en: ["Ready for tomorrow?", "Working late? ATLAS has you.", "Late-night ideas are the best."] },
}

export default function HomePage() {
  const { lang } = useLang()
  const [userName, setUserName] = useState("ผู้ใช้")
  const [counts, setCounts] = useState({ docs: 0, files: 0, automations: 0 })

  const h = new Date().getHours()
  const period = h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night"
  const greeting = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : h < 21 ? "Good Evening" : "Good Night"
  const subLine = greetingLines[period][lang][new Date().getDay() % greetingLines[period][lang].length]

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const name = data.user?.user_metadata?.full_name ?? data.user?.email?.split("@")[0] ?? "ผู้ใช้"
      setUserName(name)
      const [docsRes, filesRes, autoRes] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("files").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("automations").select("id", { count: "exact", head: true }).eq("user_id", data.user.id).eq("is_active", true),
      ])
      setCounts({ docs: docsRes.count ?? 0, files: filesRes.count ?? 0, automations: autoRes.count ?? 0 })
    })
  }, [])

  const aiSummary = [
    { text: lang === "th" ? `เอกสาร ${counts.docs} ฉบับพร้อมใช้งาน` : `${counts.docs} document${counts.docs !== 1 ? "s" : ""} ready`, show: true },
    { text: lang === "th" ? `ไฟล์ ${counts.files} ไฟล์ใน Workspace` : `${counts.files} file${counts.files !== 1 ? "s" : ""} in Workspace`, show: counts.files > 0 },
    { text: lang === "th" ? `Automation ${counts.automations} workflow` : `${counts.automations} automation workflow${counts.automations !== 1 ? "s" : ""}`, show: counts.automations > 0 },
    { text: lang === "th" ? "ล่าสุดใช้งาน Documents" : "Last used: Documents", show: true },
  ].filter(i => i.show)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Hero ── */}
      <div className="hero-section" style={{
        position: "relative", overflow: "hidden", borderRadius: 24,
        padding: "48px 44px 36px",
        border: "1px solid rgba(99,102,241,0.14)",
        background: "var(--hero-bg)",
      }}>
        {/* Noise overlay — Arc Browser style */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 24, opacity: 0.035, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }} />

        {/* ATLAS Active — absolute top-right */}
        <div className="atlas-active-card" style={{ position: "absolute", top: 24, right: 28, width: 188 }}>
          <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", display: "inline-block", animation: "atlasPulse 2s infinite" }} />
              ATLAS Active
            </div>
            {atlasStatus[lang].map((item, i, arr) => (
              <div key={i} style={{ fontSize: 11, color: "var(--tx-muted)", padding: "4px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--bg-divider)" : "none" }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Hero text — centered */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--pill-indigo-bg)", border: "1px solid var(--pill-indigo-border)", borderRadius: 20, padding: "5px 16px", fontSize: 12, color: "var(--pill-indigo-color)", marginBottom: 14, fontWeight: 600 }}>
            {greeting} 👋
          </div>

          <h1 className="hero-heading" style={{ fontSize: 44, fontWeight: 900, color: "var(--tx-main)", lineHeight: 1.1, marginBottom: 6 }}>
            {lang === "th" ? "สวัสดี," : "Hello,"}{" "}
            <span style={{ background: "linear-gradient(135deg,#818cf8,#a78bfa,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {userName}
            </span>
          </h1>

          <p className="hero-subline" style={{ color: "var(--tx-muted)", fontSize: 15, marginBottom: 16, fontStyle: "italic" }}>{subLine}</p>

          {/* AI summary chips row */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {aiSummary.map((item, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--chip-green-bg)", border: "1px solid var(--chip-green-border)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "var(--chip-green-color)", whiteSpace: "nowrap" }}>
                <CheckCircle2 size={11} color="var(--chip-green-icon)" />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Command Center */}
        <AICommandBar />

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "center", flexWrap: "wrap" }}>
          {quickActions.map(action => (
            <Link key={action.en} href={action.href} style={{ textDecoration: "none" }}>
              <div
                className="quick-action-item"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "11px 16px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 14, cursor: "pointer", minWidth: 76, transition: "all .18s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.14)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.transform = "translateY(0)" }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{action.icon}</span>
                <span style={{ fontSize: 11, color: "var(--tx-muted)", whiteSpace: "nowrap", fontWeight: 500 }}>{action[lang]}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Files */}
      <RecentFiles />

      {/* Modules */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 16, background: "linear-gradient(#6366f1,#8b5cf6)", borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {lang === "th" ? "เครื่องมือ AI" : "AI Workspace"}
          </span>
        </div>
        <div className="module-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {modules.map(mod => {
            const Icon = mod.icon
            return (
              <Link key={mod.href} href={mod.href} style={{ textDecoration: "none" }}>
                <div
                  style={{ background: `${mod.color}10`, border: `1px solid ${mod.color}22`, borderRadius: 16, padding: "20px 18px", cursor: "pointer", transition: "all .25s cubic-bezier(.4,0,.2,1)", height: "100%", boxSizing: "border-box" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.01)"
                    e.currentTarget.style.boxShadow = `0 24px 56px ${mod.color}55, 0 8px 24px ${mod.color}30`
                    e.currentTarget.style.borderColor = `${mod.color}65`
                    e.currentTarget.style.background = `${mod.color}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)"
                    e.currentTarget.style.boxShadow = "none"
                    e.currentTarget.style.borderColor = `${mod.color}22`
                    e.currentTarget.style.background = `${mod.color}10`
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${mod.color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: `0 4px 16px ${mod.color}30` }}>
                    <Icon size={20} color={mod.color} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 4 }}>{mod[lang]}</div>
                  <div style={{ fontSize: 12, color: "var(--tx-dim)", lineHeight: 1.5 }}>{lang === "th" ? mod.descTh : mod.descEn}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Stats — meaningful */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, paddingBottom: 8 }}>
        {[
          { label: lang === "th" ? "เอกสาร" : "Documents", value: counts.docs || "—", sub: lang === "th" ? "+2 วันนี้"   : "+2 Today",          color: "#6366f1" },
          { label: lang === "th" ? "แม่แบบ" : "Templates",  value: "50+",              sub: lang === "th" ? "ใช้บ่อยที่สุด" : "Most Used",        color: "#10b981" },
          { label: lang === "th" ? "AI Models" : "AI Models", value: "3",              sub: "Claude · GPT · Gem",                                  color: "#8b5cf6" },
          { label: lang === "th" ? "ส่งออก" : "Export",     value: "4",               sub: "PDF DOCX PPTX XLSX",                                  color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 16, padding: "20px 22px", transition: "border-color .2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color + "50"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--bg-border)"}
          >
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, marginBottom: 4, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "var(--tx-faint)", letterSpacing: "0.02em" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <style>{`@keyframes atlasPulse{0%,100%{opacity:1;box-shadow:0 0 6px #10b981}50%{opacity:0.5;box-shadow:0 0 14px #10b981}}`}</style>
    </div>
  )
}
