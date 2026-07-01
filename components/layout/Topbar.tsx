"use client"

import { useState, useEffect } from "react"
import { Menu, Plus, Bell, User, Sun, Moon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "@/contexts/ThemeContext"
import { useLang } from "@/contexts/LanguageContext"

const PAGE_TITLES: Record<string, { th: string; en: string }> = {
  "/home":       { th: "พื้นที่ทำงาน AI",  en: "AI Workspace" },
  "/documents":  { th: "เอกสาร",           en: "Documents" },
  "/sheets":     { th: "ตาราง",            en: "Sheets" },
  "/slides":     { th: "สไลด์",            en: "Slides" },
  "/pdf":        { th: "PDF",              en: "PDF" },
  "/files":      { th: "ไฟล์",            en: "Files" },
  "/search":     { th: "ค้นหา",           en: "Search" },
  "/knowledge":  { th: "คลังความรู้",      en: "Knowledge" },
  "/automation": { th: "ระบบอัตโนมัติ",    en: "Automation" },
  "/templates":  { th: "แม่แบบเอกสาร",    en: "Templates" },
  "/settings":   { th: "ตั้งค่า",          en: "Settings" },
}

const NEW_ROUTES: Record<string, string> = {
  "/documents": "/documents",
  "/sheets":    "/sheets",
  "/slides":    "/slides",
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang } = useLang()
  const [userEmail, setUserEmail] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email ?? "")
    })
  }, [])

  const matchedKey = Object.keys(PAGE_TITLES).find(
    k => k === "/home" ? pathname === "/home" : pathname.startsWith(k)
  ) ?? "/home"
  const title = PAGE_TITLES[matchedKey][lang]

  const newRoute = Object.entries(NEW_ROUTES).find(([k]) =>
    k === "/home" ? pathname === "/home" : pathname.startsWith(k)
  )?.[1]

  const isDark = theme === "dark"

  return (
    <header style={{
      height: 64, background: "var(--bg-topbar)", borderBottom: "1px solid var(--topbar-border)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0
    }}>
      <button onClick={onMenuClick} className="mobile-menu-btn" style={{ display: "none", background: "none", border: "none", color: "var(--tx-muted)", cursor: "pointer", padding: 4 }}>
        <Menu size={20} />
      </button>
      <style>{`@media(max-width:768px){.mobile-menu-btn{display:flex!important}}`}</style>

      <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--tx-main)", flex: 1 }}>{title}</h1>

      {/* AI Status pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", animation: "aiPulse 2s infinite" }} />
        <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600, whiteSpace: "nowrap" }}>AI Ready</span>
      </div>

      {newRoute && (
        <Link href={newRoute} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          <Plus size={14} />
          {lang === "th" ? "สร้างใหม่" : "New"}
        </Link>
      )}

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        title={lang === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
        style={{
          height: 36, padding: "0 10px", borderRadius: 10,
          background: "var(--bg-card)", border: "1px solid var(--bg-border)",
          display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
          fontWeight: 700, fontSize: 12, letterSpacing: "0.04em",
        }}
      >
        <span style={{ color: lang === "th" ? "#6366f1" : "var(--tx-faint)" }}>TH</span>
        <span style={{ color: "var(--tx-faint)", fontWeight: 400 }}>/</span>
        <span style={{ color: lang === "en" ? "#6366f1" : "var(--tx-faint)" }}>EN</span>
      </button>

      {/* Theme toggle */}
      <button onClick={toggleTheme} title={isDark ? (lang === "th" ? "โหมดสว่าง" : "Light mode") : (lang === "th" ? "โหมดมืด" : "Dark mode")}
        style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {isDark ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
      </button>

      <button style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <Bell size={15} color="var(--tx-dim)" />
      </button>

      <div style={{ position: "relative" }}>
        <button onClick={() => setShowUserMenu(p => !p)}
          style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <User size={16} color="#fff" />
        </button>
        {showUserMenu && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--bg-dropdown)", border: "1px solid var(--bg-dropdown-border)", borderRadius: 12, padding: 8, minWidth: 180, zIndex: 50 }}>
            <div style={{ padding: "8px 12px", color: "var(--tx-dim)", fontSize: 12, borderBottom: "1px solid var(--bg-border)", marginBottom: 4 }}>{userEmail}</div>
            <Link href="/settings" onClick={() => setShowUserMenu(false)} style={{ display: "block", padding: "8px 12px", color: "var(--tx-muted)", fontSize: 13, borderRadius: 8, textDecoration: "none" }}>
              {lang === "th" ? "ตั้งค่า" : "Settings"}
            </Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push("/sign-in") }} style={{ display: "block", width: "100%", padding: "8px 12px", color: "#f87171", fontSize: 13, borderRadius: 8, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              {lang === "th" ? "ออกจากระบบ" : "Sign Out"}
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes aiPulse{0%,100%{opacity:1;box-shadow:0 0 6px #10b981}50%{opacity:0.6;box-shadow:0 0 12px #10b981}}`}</style>
    </header>
  )
}
