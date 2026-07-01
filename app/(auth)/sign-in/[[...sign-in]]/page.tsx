"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)",
  borderRadius: 12, padding: "12px 16px", color: "var(--tx-main)",
  fontSize: 15, outline: "none", boxSizing: "border-box",
}

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/documents")
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚡</div>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--tx-main)" }}>ATLAS Office™</span>
          </div>
          <p style={{ color: "var(--tx-muted)", fontSize: 15 }}>AI Productivity Operating System</p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 24, padding: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--tx-main)" }}>เข้าสู่ระบบ</h2>
          <p style={{ color: "var(--tx-muted)", marginBottom: 28, fontSize: 14 }}>ยินดีต้อนรับกลับมา</p>

          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "var(--tx-dim)", fontSize: 13, marginBottom: 6 }}>อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                onBlur={e => e.target.style.borderColor = "var(--bg-border)"}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "var(--tx-dim)", fontSize: 13, marginBottom: 6 }}>รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                onBlur={e => e.target.style.borderColor = "var(--bg-border)"}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", height: 50, background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", transition: ".2s" }}
            >
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, color: "var(--tx-dim)", fontSize: 14 }}>
            ยังไม่มีบัญชี?{" "}
            <Link href="/sign-up" style={{ color: "#6366f1", fontWeight: 600 }}>สมัครฟรี</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
