"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Table2, Presentation, FileSearch, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { useLang } from "@/contexts/LanguageContext"

type RecentItem = { id: string; title: string; type: string; href: string; updated_at: string }

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; th: string; en: string }> = {
  document: { icon: <FileText size={22} color="#6366f1" />, color: "#6366f1", bg: "rgba(99,102,241,0.15)",  th: "เอกสาร", en: "Document" },
  sheet:    { icon: <Table2 size={22} color="#10b981" />,   color: "#10b981", bg: "rgba(16,185,129,0.15)",  th: "ตาราง",  en: "Sheet" },
  slide:    { icon: <Presentation size={22} color="#f59e0b" />, color: "#f59e0b", bg: "rgba(245,158,11,0.15)", th: "สไลด์", en: "Slides" },
  pdf:      { icon: <FileSearch size={22} color="#ef4444" />,   color: "#ef4444", bg: "rgba(239,68,68,0.15)", th: "PDF",   en: "PDF" },
}

export default function RecentFiles() {
  const { lang } = useLang()
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [docs, sheets, slides] = await Promise.all([
        supabase.from("documents").select("id,title,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(3),
        supabase.from("sheets").select("id,title,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(2),
        supabase.from("presentations").select("id,title,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
      ])

      const all: RecentItem[] = [
        ...(docs.data ?? []).map(d => ({ ...d, type: "document", href: `/documents/${d.id}` })),
        ...(sheets.data ?? []).map(s => ({ ...s, type: "sheet", href: `/sheets/${s.id}` })),
        ...(slides.data ?? []).map(s => ({ ...s, type: "slide", href: `/slides/${s.id}` })),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6)

      setItems(all)
    }
    load()
  }, [])

  if (!items.length) return null

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 16, background: "linear-gradient(#6366f1,#8b5cf6)", borderRadius: 2 }} />
        <Clock size={13} color="var(--tx-dim)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {lang === "th" ? "เปิดล่าสุด" : "Recent"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 10 }}>
        {items.map(item => {
          const cfg = typeConfig[item.type] ?? typeConfig.document
          return (
            <Link key={item.id} href={item.href} style={{ textDecoration: "none" }}>
              <div
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)"
                  e.currentTarget.style.boxShadow = `0 12px 32px ${cfg.color}25`
                  e.currentTarget.style.borderColor = `${cfg.color}40`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.borderColor = "var(--bg-border)"
                }}
              >
                {/* Thumbnail area */}
                <div style={{ height: 80, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  {/* Subtle pattern */}
                  <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 9px)" }} />
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${cfg.color}25`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${cfg.color}30` }}>
                    {cfg.icon}
                  </div>
                  {/* Type badge */}
                  <div style={{ position: "absolute", top: 8, right: 8, background: `${cfg.color}22`, border: `1px solid ${cfg.color}35`, borderRadius: 6, padding: "2px 7px", fontSize: 10, color: cfg.color, fontWeight: 700 }}>
                    {cfg[lang]}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--tx-faint)" }}>{formatDate(item.updated_at)}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
