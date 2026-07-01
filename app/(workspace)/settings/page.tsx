"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { User, KeyRound, CheckCircle, Crown } from "lucide-react"
import type { Profile } from "@/types"

const langs = [
  { value: "th", label: "🇹🇭 ภาษาไทย" },
  { value: "en", label: "🇺🇸 English" },
  { value: "zh", label: "🇨🇳 中文" },
  { value: "ja", label: "🇯🇵 日本語" },
]

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-main)", border: "1px solid var(--bg-border)",
  borderRadius: 16, padding: 24, marginBottom: 24,
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)",
  borderRadius: 10, padding: "10px 14px", color: "var(--tx-main)",
  fontSize: 14, outline: "none", boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, color: "var(--tx-dim)", marginBottom: 6,
}

export default function SettingsPage() {
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [email, setEmail]         = useState("")
  const [fullName, setFullName]   = useState("")
  const [language, setLanguage]   = useState("th")
  const [saved, setSaved]         = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? "")
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (data) { setProfile(data); setFullName(data.full_name ?? ""); setLanguage(data.default_language ?? "th") }
    }
    load()
  }, [])

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("profiles").update({ full_name: fullName, default_language: language }).eq("id", user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleUpgrade() {
    if (!profile) return
    setUpgrading(true)
    const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: profile.id, email }) })
    const { url } = await res.json()
    if (url) window.location.href = url
    setUpgrading(false)
  }

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = "rgba(99,102,241,0.45)"
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = "var(--bg-border)"
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28, color: "var(--tx-main)" }}>Settings</h2>

      {/* Plan */}
      <div style={{
        ...sectionStyle,
        background: profile?.plan === "pro"
          ? "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06))"
          : "var(--bg-main)",
        borderColor: profile?.plan === "pro" ? "rgba(99,102,241,0.25)" : "var(--bg-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Crown size={18} color={profile?.plan === "pro" ? "#a5b4fc" : "var(--tx-dim)"} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tx-primary)" }}>แผนการใช้งาน</div>
        </div>
        {profile?.plan === "pro" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a5b4fc", fontWeight: 700 }}>
            <CheckCircle size={16} />
            PRO Plan — เอกสารไม่จำกัด + ฟีเจอร์ทั้งหมด
          </div>
        ) : (
          <div>
            <div style={{ color: "var(--tx-dim)", fontSize: 14, marginBottom: 16 }}>Free Plan — สร้างได้ 10 เอกสาร/เดือน</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {["เอกสารไม่จำกัด", "AI Sheets + Slides", "Team Workspace", "Priority Support"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--tx-muted)" }}>
                  <CheckCircle size={12} color="#6366f1" />
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              style={{ padding: "10px 24px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              {upgrading ? "กำลังโหลด…" : "⚡ อัปเกรด PRO"}
            </button>
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <User size={16} color="#6366f1" />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tx-primary)" }}>ข้อมูลส่วนตัว</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>อีเมล</label>
            <input
              value={email}
              disabled
              style={{ ...inputStyle, color: "var(--tx-faint)", cursor: "not-allowed" }}
            />
          </div>
          <div>
            <label style={labelStyle}>ชื่อ-นามสกุล</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>
          <div>
            <label style={labelStyle}>ภาษาเริ่มต้น</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{ ...inputStyle, appearance: "auto" }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            >
              {langs.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <button
            onClick={saveProfile}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", background: saved ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.12)", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)"}`, borderRadius: 10, color: saved ? "#34d399" : "#a5b4fc", fontWeight: 600, cursor: "pointer" }}
          >
            {saved && <CheckCircle size={14} />}
            {saved ? "บันทึกแล้ว" : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>

      {/* API Keys info */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <KeyRound size={16} color="#6366f1" />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tx-primary)" }}>API Keys</div>
        </div>
        <p style={{ color: "var(--tx-dim)", fontSize: 14, lineHeight: 1.7 }}>
          ATLAS Office™ ใช้ Claude AI (Anthropic) และ GPT-4o (OpenAI) ในการสร้างเนื้อหา<br />
          API Keys ถูกตั้งค่าบน Server โดย Administrator เท่านั้น
        </p>
      </div>
    </div>
  )
}
