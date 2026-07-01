"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Bot, User } from "lucide-react"
import { useLang } from "@/contexts/LanguageContext"

type Message = { role: "user" | "assistant"; content: string }

export default function PDFChatPanel({ fileId, fileName }: { fileId: string; fileName: string }) {
  const { lang } = useLang()
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: lang === "th"
        ? `สวัสดีครับ! ผมช่วยตอบคำถามเกี่ยวกับ **${fileName}** ได้เลย 😊 มีคำถามอะไรไหมครับ?`
        : `Hi! I can answer questions about **${fileName}** 😊 What would you like to know?`
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    const res = await fetch("/api/ai/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, question: userMsg, history: messages }),
    })
    const { answer } = await res.json()
    setMessages(prev => [...prev, { role: "assistant", content: answer }])
    setLoading(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-main)", borderLeft: "1px solid var(--bg-border)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bg-border)", fontWeight: 600, fontSize: 14, color: "var(--tx-primary)" }}>
        💬 {lang === "th" ? "ถาม AI เกี่ยวกับไฟล์นี้" : "Ask AI about this file"}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={14} color="#6366f1" />
              </div>
            )}
            <div style={{
              maxWidth: "80%", padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--bg-card)",
              color: msg.role === "user" ? "#fff" : "var(--tx-main)", fontSize: 14, lineHeight: 1.6,
            }}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={14} color="#fff" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={14} color="#6366f1" />
            </div>
            <Loader2 size={16} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: 12, borderTop: "1px solid var(--bg-border)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={lang === "th" ? "ถามเกี่ยวกับไฟล์นี้…" : "Ask about this file…"}
          style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "10px 14px", color: "var(--tx-main)", fontSize: 13, outline: "none" }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
          onBlur={e => e.target.style.borderColor = "var(--bg-border)"}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Send size={14} color="#fff" />
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
