"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { useLang } from "@/contexts/LanguageContext"

export default function AICommandBar() {
  const { lang } = useLang()
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(prompt: string) {
    if (!prompt.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/ai/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const intent = await res.json()
      router.push(`/${intent.module}?prompt=${encodeURIComponent(prompt)}&type=${intent.docType ?? ""}`)
    } catch {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(value)
    }
  }

  const isActive = focused || !!value

  return (
    <div style={{ width: "100%", maxWidth: 840, margin: "0 auto" }}>
      {/* Command Center box */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          background: isActive ? "rgba(99,102,241,0.08)" : "var(--bg-card)",
          border: `1.5px solid ${isActive ? "rgba(99,102,241,0.4)" : "var(--bg-border)"}`,
          borderRadius: 20, padding: "14px 16px 12px",
          boxShadow: isActive
            ? "0 0 60px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.25)"
            : "0 0 40px rgba(99,102,241,0.08), 0 4px 20px rgba(0,0,0,0.15)",
          transition: "all .25s ease",
          cursor: "text",
          animation: isActive ? "none" : "commandBreathe 4s ease-in-out infinite",
        }}
      >
        {/* Top label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Sparkles size={16} color="#6366f1" style={{ flexShrink: 0, animation: isActive ? "none" : "sparkleRotate 3s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {lang === "th" ? "วันนี้อยากสร้างอะไร?" : "What would you like to create today?"}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: isActive ? "rgba(99,102,241,0.25)" : "var(--bg-divider)", marginBottom: 12, transition: "background .25s" }} />

        {/* Input row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, position: "relative" }}>
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={lang === "th"
              ? "พิมพ์คำสั่ง เช่น สร้าง Pitch Deck สำหรับ Startup เพื่อระดมทุน Series A..."
              : "Type a command, e.g. Create a Series A pitch deck for my startup..."
            }
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--tx-main)", fontSize: 18, resize: "none", lineHeight: 1.6,
              fontFamily: "inherit", minHeight: 30, maxHeight: 200,
              caretColor: "#818cf8",
            }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = "auto"
              t.style.height = t.scrollHeight + "px"
            }}
          />
          <button
            onClick={() => handleSubmit(value)}
            disabled={!value.trim() || loading}
            style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: value.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--bg-card-hover)",
              border: "none", cursor: value.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s",
              boxShadow: value.trim() ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
            }}
          >
            {loading
              ? <Loader2 size={18} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
              : <ArrowRight size={18} color={value.trim() ? "#fff" : "var(--tx-faint)"} />
            }
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <p style={{ textAlign: "center", color: "var(--tx-faint)", fontSize: 12, marginTop: 12, letterSpacing: "0.02em" }}>
        {lang === "th"
          ? <>✨ AI สร้างเอกสาร สไลด์ ตาราง และ PDF ได้ทันที &nbsp;·&nbsp; กด <kbd style={{ background: "var(--bg-card-hover)", padding: "1px 6px", borderRadius: 5, fontSize: 11, color: "var(--tx-muted)", border: "1px solid var(--bg-border)" }}>Enter</kbd> เพื่อสร้าง</>
          : <>✨ AI generates docs, slides, sheets &amp; PDF instantly &nbsp;·&nbsp; Press <kbd style={{ background: "var(--bg-card-hover)", padding: "1px 6px", borderRadius: 5, fontSize: 11, color: "var(--tx-muted)", border: "1px solid var(--bg-border)" }}>Enter</kbd> to create</>
        }
      </p>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes commandBreathe {
          0%,100%{ box-shadow:0 0 40px rgba(99,102,241,0.08),0 4px 20px rgba(0,0,0,0.15) }
          50%{ box-shadow:0 0 70px rgba(99,102,241,0.18),0 4px 24px rgba(0,0,0,0.2) }
        }
        @keyframes sparkleRotate {
          0%,100%{ transform:rotate(-8deg) scale(1) }
          50%{ transform:rotate(8deg) scale(1.15) }
        }
      `}</style>
    </div>
  )
}
