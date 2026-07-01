"use client"

import { Sparkles, Loader2 } from "lucide-react"
import { useLang } from "@/contexts/LanguageContext"

const ACTIONS: { key: string; th: string; en: string }[] = [
  { key: "improve",      th: "✨ ปรับปรุง",    en: "✨ Improve" },
  { key: "rewrite",      th: "↺ เขียนใหม่",    en: "↺ Rewrite" },
  { key: "summarize",    th: "⬛ สรุป",         en: "⬛ Summarize" },
  { key: "translate",    th: "🌐 แปลภาษา",     en: "🌐 Translate" },
  { key: "professional", th: "💼 ทางการ",       en: "💼 Professional" },
  { key: "shorter",      th: "✂ สั้นลง",       en: "✂ Shorter" },
  { key: "longer",       th: "+ ยาวขึ้น",       en: "+ Longer" },
]

type Props = {
  position: { top: number; left: number }
  onAction: (action: string) => void
  loading?: boolean
}

export default function FloatingAIToolbar({ position, onAction, loading }: Props) {
  const { lang } = useLang()
  return (
    <div style={{
      position: "fixed", zIndex: 1000,
      top: position.top - 56, left: Math.max(12, position.left - 8),
      display: "flex", alignItems: "center", gap: 2,
      background: "var(--bg-main, #0f0f1a)",
      border: "1px solid rgba(99,102,241,0.35)",
      borderRadius: 14, padding: "6px 10px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 28px rgba(99,102,241,0.18)",
      animation: "floatUp .15s ease",
    }}>
      {loading
        ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", color: "#a5b4fc", fontSize: 12 }}>
            <Loader2 size={13} style={{ animation: "spinAI 1s linear infinite" }} />
            {lang === "th" ? "ATLAS กำลังแก้ไข…" : "ATLAS is editing…"}
          </div>
        )
        : (
          <>
            <Sparkles size={12} color="#6366f1" style={{ marginRight: 4, flexShrink: 0 }} />
            {ACTIONS.map(a => (
              <button key={a.key}
                onMouseDown={e => { e.preventDefault(); onAction(a.key) }}
                style={{ padding: "4px 10px", borderRadius: 7, background: "transparent", border: "none", color: "var(--tx-muted, #94a3b8)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.color = "#a5b4fc" }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--tx-muted, #94a3b8)" }}
              >
                {a[lang]}
              </button>
            ))}
          </>
        )
      }
      {/* Arrow */}
      <div style={{ position: "absolute", bottom: -5, left: 20, width: 10, height: 10, background: "var(--bg-main, #0f0f1a)", border: "1px solid rgba(99,102,241,0.35)", transform: "rotate(45deg)", borderTop: "none", borderLeft: "none" }} />
      <style>{`
        @keyframes floatUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spinAI  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
