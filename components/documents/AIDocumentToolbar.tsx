"use client"

import { Wand2, Languages, FileOutput, Mic, RefreshCw, Loader2 } from "lucide-react"
import { useLang } from "@/contexts/LanguageContext"

type Action = "rewrite" | "translate" | "summarize" | "tone-formal" | "tone-casual"

type Props = {
  onAction: (action: Action, target?: string) => void
  loading: boolean
  language: string
  onLanguageChange: (lang: string) => void
}

const actions: { key: Action; th: string; en: string; icon: React.ElementType }[] = [
  { key: "rewrite",     th: "เขียนใหม่",  en: "Rewrite",      icon: Wand2 },
  { key: "summarize",   th: "สรุป",       en: "Summarize",    icon: FileOutput },
  { key: "translate",   th: "แปลภาษา",   en: "Translate",    icon: Languages },
  { key: "tone-formal", th: "ทางการ",     en: "Formal tone",  icon: Mic },
  { key: "tone-casual", th: "ไม่ทางการ", en: "Casual tone",  icon: RefreshCw },
]

const languages = [
  { value: "th", label: "🇹🇭 ไทย" },
  { value: "en", label: "🇺🇸 English" },
  { value: "zh", label: "🇨🇳 中文" },
  { value: "ja", label: "🇯🇵 日本語" },
]

export default function AIDocumentToolbar({ onAction, loading, language, onLanguageChange }: Props) {
  const { lang } = useLang()
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "4px 6px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", color: "#6366f1", fontSize: 13 }}>
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            {lang === "th" ? "AI กำลังทำงาน…" : "AI working…"}
          </div>
        ) : (
          actions.map(a => {
            const Icon = a.icon
            return (
              <button
                key={a.key}
                onClick={() => onAction(a.key)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "transparent", border: "none", color: "var(--tx-muted)", fontSize: 12, cursor: "pointer", transition: ".15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.color = "#a5b4fc" }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--tx-muted)" }}
              >
                <Icon size={12} />
                {a[lang]}
              </button>
            )
          })
        )}
      </div>

      <select
        value={language}
        onChange={e => onLanguageChange(e.target.value)}
        style={{ background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "5px 8px", color: "var(--tx-muted)", fontSize: 12, cursor: "pointer" }}
      >
        {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
