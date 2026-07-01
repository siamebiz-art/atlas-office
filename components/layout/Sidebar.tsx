"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard, FileText, Table2, Presentation, FileSearch,
  FolderOpen, Search, Brain, Zap, Settings, LogOut, BookOpen, Sparkles,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useLang } from "@/contexts/LanguageContext"
import AICreateDialog from "@/components/workspace/AICreateDialog"

type NavItem = {
  th: string
  en: string
  href: string
  icon: React.ElementType
  color: string
  badge?: string | number
}

type Section = {
  th: string
  en: string
  items: NavItem[]
}

const SECTIONS: Section[] = [
  {
    th: "พื้นที่ทำงาน",
    en: "Workspace",
    items: [
      { th: "แดชบอร์ด",    en: "Dashboard",  href: "/home",      icon: LayoutDashboard, color: "#6366f1" },
    ],
  },
  {
    th: "สร้าง",
    en: "Create",
    items: [
      { th: "เอกสาร",      en: "Documents",  href: "/documents", icon: FileText,     color: "#6366f1" },
      { th: "ตาราง",       en: "Sheets",     href: "/sheets",    icon: Table2,       color: "#10b981" },
      { th: "สไลด์",       en: "Slides",     href: "/slides",    icon: Presentation, color: "#f59e0b" },
      { th: "PDF",          en: "PDF",        href: "/pdf",       icon: FileSearch,   color: "#ef4444" },
      { th: "แม่แบบ",      en: "Templates",  href: "/templates", icon: BookOpen,     color: "#8b5cf6" },
    ],
  },
  {
    th: "จัดการ",
    en: "Manage",
    items: [
      { th: "ไฟล์",        en: "Files",      href: "/files",      icon: FolderOpen, color: "#8b5cf6" },
      { th: "ค้นหา",       en: "Search",     href: "/search",     icon: Search,     color: "#06b6d4" },
      { th: "คลังความรู้", en: "Knowledge",  href: "/knowledge",  icon: Brain,      color: "#ec4899" },
      { th: "อัตโนมัติ",   en: "Automation", href: "/automation", icon: Zap,        color: "#f97316", badge: "Active" },
    ],
  },
  {
    th: "ระบบ",
    en: "Settings",
    items: [
      { th: "ตั้งค่า",     en: "Settings",   href: "/settings",   icon: Settings,   color: "var(--tx-dim)" },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { lang } = useLang()
  const [hovered, setHovered] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/sign-in")
  }

  return (
    <>
    <aside style={{
      width: 260, height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg-sidebar-solid)", borderRight: "1px solid var(--sidebar-border)",
      boxSizing: "border-box", overflowY: "auto",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "20px 14px 14px", borderBottom: "1px solid var(--bg-divider)", flexShrink: 0 }}>
        {/* Logo + Status */}
        <Link href="/home" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <img src="/iconLogoOffice.png" alt="ATLAS Office" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--tx-main)", lineHeight: 1, letterSpacing: "-0.01em" }}>
              ATLAS Office™
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px #10b981", display: "inline-block", flexShrink: 0, animation: "wReady 2.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>
                {lang === "th" ? "พร้อมใช้งาน" : "Workspace Ready"}
              </span>
            </div>
          </div>
        </Link>

        {/* ✨ AI Create button */}
        <button
          onClick={() => setDialogOpen(true)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, cursor: "pointer", transition: "all 200ms ease", textAlign: "left" }}
          onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(99,102,241,0.28),rgba(139,92,246,0.2))"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.25)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}
        >
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={12} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", flex: 1 }}>
            {lang === "th" ? "สร้างด้วย AI" : "AI Create"}
          </span>
          <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700 }}>⭐⭐⭐</span>
        </button>
      </div>

      {/* ── Nav Sections ── */}
      <nav style={{ flex: 1, padding: "6px 8px", overflowY: "auto" }}>
        {SECTIONS.map((section, si) => {
          const isLast = si === SECTIONS.length - 1
          return (
            <div key={section.en}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-faint)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "10px 8px 5px" }}>
                {section[lang]}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {section.items.map(item => {
                  const isActive = item.href === "/home"
                    ? pathname === "/home"
                    : pathname.startsWith(item.href)
                  const isHover = hovered === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => setHovered(item.href)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: 9,
                        padding: "8px 10px 8px 12px", borderRadius: 10,
                        textDecoration: "none", position: "relative", overflow: "hidden",
                        background: isActive
                          ? `${item.color}14`
                          : isHover ? "var(--bg-card-hover)" : "transparent",
                        boxShadow: isActive ? `0 0 18px ${item.color}18` : "none",
                        transition: "all 200ms ease",
                      }}
                    >
                      {/* Left indicator bar */}
                      <div style={{
                        position: "absolute", left: 0, top: "18%", bottom: "18%",
                        width: isActive ? 4 : 0, borderRadius: "0 4px 4px 0",
                        background: item.color,
                        boxShadow: isActive ? `0 0 8px ${item.color}90` : "none",
                        transition: "all 200ms ease",
                      }} />

                      {/* Icon */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? `${item.color}20` : isHover ? "var(--bg-card-hover)" : "transparent",
                        transform: isHover && !isActive ? "scale(1.05)" : "scale(1)",
                        transition: "all 200ms ease",
                      }}>
                        <Icon
                          size={15}
                          color={isActive ? item.color : isHover ? "var(--tx-primary)" : "var(--tx-dim)"}
                          strokeWidth={isActive ? 2.5 : 1.75}
                        />
                      </div>

                      {/* Label */}
                      <span style={{
                        flex: 1, fontSize: 13.5,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "var(--tx-main)" : isHover ? "var(--tx-primary)" : "var(--tx-muted)",
                        letterSpacing: isActive ? "0.01em" : "0",
                        transition: "all 200ms ease",
                      }}>
                        {item[lang]}
                      </span>

                      {/* Badge */}
                      {item.badge !== undefined && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 8,
                          background: typeof item.badge === "number"
                            ? "rgba(99,102,241,0.15)"
                            : "rgba(16,185,129,0.15)",
                          color: typeof item.badge === "number" ? "#a5b4fc" : "#10b981",
                          flexShrink: 0,
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>

              {!isLast && (
                <div style={{ height: 1, background: "var(--bg-divider)", margin: "8px 8px 0" }} />
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ padding: "10px 12px 16px", borderTop: "1px solid var(--bg-divider)", flexShrink: 0 }}>
        {/* PRO card */}
        <div style={{ border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#a5b4fc", letterSpacing: "0.06em" }}>PRO</div>
            <div style={{ fontSize: 11, color: "var(--tx-dim)", marginTop: 2 }}>
              {lang === "th" ? "AI ไม่จำกัด" : "Unlimited AI"}
            </div>
          </div>
          <Link href="/settings" style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, textDecoration: "none" }}>
            {lang === "th" ? "อัปเกรด →" : "Upgrade →"}
          </Link>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "transparent", border: "none", color: "var(--tx-faint)", fontSize: 12, cursor: "pointer", width: "100%", transition: "color 200ms ease" }}
          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--tx-faint)"}
        >
          <LogOut size={12} />
          {lang === "th" ? "ออกจากระบบ" : "Sign Out"}
        </button>
      </div>

      <style>{`@keyframes wReady{0%,100%{opacity:1;box-shadow:0 0 5px #10b981}50%{opacity:0.55;box-shadow:0 0 10px #10b981}}`}</style>
    </aside>

    <AICreateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
