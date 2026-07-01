"use client"

import { useEffect, useState, useCallback, useRef, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Save, CheckCircle, Sparkles, Send, Loader2, Bot,
  User, Pencil, MoreHorizontal,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import DocumentEditor, { type DocumentEditorHandle, type SelectionInfo } from "@/components/documents/DocumentEditor"
import EditorToolbar from "@/components/documents/EditorToolbar"
import FloatingAIToolbar from "@/components/documents/FloatingAIToolbar"
import ExportMenu from "@/components/shared/ExportMenu"
import type { Document } from "@/types"
import { useLang } from "@/contexts/LanguageContext"

type Message = { role: "user" | "ai"; text: string; loading?: boolean }

const QUICK_PROMPTS = {
  th: [
    "สรุปเอกสารนี้เป็น 3 จุดสำคัญ",
    "แปลทั้งเอกสารเป็นภาษาอังกฤษ",
    "ปรับให้เป็นทางการมากขึ้น",
    "เพิ่มส่วนสรุปท้ายเอกสาร",
    "ตรวจและแก้ไขไวยากรณ์",
  ],
  en: [
    "Summarize this document into 3 key points",
    "Translate the entire document to Thai",
    "Make it more formal",
    "Add an executive summary section",
    "Check and fix grammar",
  ],
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { lang } = useLang()
  const { id } = use(params)
  const router = useRouter()

  const [doc, setDoc]       = useState<Document | null>(null)
  const [content, setContent] = useState("")
  const [title, setTitle]   = useState("")
  const [language, setLanguage] = useState("th")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [editMode, setEditMode] = useState<"ai" | "manual">("ai")

  // AI chat panel
  const [messages, setMessages]   = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Floating AI toolbar
  const [selection, setSelection] = useState<SelectionInfo>(null)
  const [floatingLoading, setFloatingLoading] = useState(false)

  const editorRef = useRef<DocumentEditorHandle>(null)

  useEffect(() => {
    supabase.from("documents").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setDoc(data)
        setContent(data.content ?? "")
        setTitle(data.title ?? "")
        setLanguage(data.language ?? "th")
      }
    })
  }, [id])

  const save = useCallback(async (c = content, t = title) => {
    setSaving(true)
    await supabase.from("documents").update({
      content: c, title: t,
      word_count: c.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
      updated_at: new Date().toISOString(),
    }).eq("id", id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [id, content, title])

  // Auto-save every 30s
  useEffect(() => {
    const t = setInterval(() => { if (content) save() }, 30000)
    return () => clearInterval(t)
  }, [content, save])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Chat / AI panel ──
  async function handleChat(e?: React.FormEvent) {
    e?.preventDefault()
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput("")
    setMessages(prev => [...prev, { role: "user", text: msg }, { role: "ai", text: "", loading: true }])
    setChatLoading(true)

    try {
      const res = await fetch("/api/ai/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, action: "instruct", instruction: msg, docType: doc?.doc_type ?? "general", language }),
      })
      const { content: newContent, message: aiMessage } = await res.json()

      // Always show AI message in chat panel
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "ai",
          text: aiMessage || (newContent ? "ดำเนินการเรียบร้อยแล้ว ✓" : "เรียบร้อยแล้ว ✓"),
        }
        return updated
      })

      // Only update document if AI returned modified content
      if (newContent) {
        setContent(newContent)
        await save(newContent, title)
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: "ai", text: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" }
        return updated
      })
    } finally {
      setChatLoading(false)
    }
  }

  // ── Floating AI toolbar ──
  async function handleFloatingAction(action: string) {
    if (!selection?.selectedHtml) return
    const selectedHtml = selection.selectedHtml
    setFloatingLoading(true)

    try {
      const res = await fetch("/api/ai/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: selectedHtml }),
      })
      const { result } = await res.json()
      if (result) {
        editorRef.current?.replaceSelection(result)
        // Update content from the editor div
        const div = editorRef.current?.getDiv()
        if (div) {
          const newContent = div.innerHTML
          setContent(newContent)
          await save(newContent, title)
        }
      }
    } finally {
      setFloatingLoading(false)
      setSelection(null)
    }
  }

  // ── Export ──
  async function handleExport(format: "docx" | "pdf" | "markdown" | "html") {
    const res = await fetch(`/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, title }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${title || "document"}.${format === "markdown" ? "md" : format}`
    a.click(); URL.revokeObjectURL(url)
  }

  function handleEditorChange(html: string) {
    setContent(html)
  }

  function handleToolbarChange() {
    const div = editorRef.current?.getDiv()
    if (div) setContent(div.innerHTML)
  }

  if (!doc) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--tx-dim)" }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite", marginRight: 8 }} />
      {lang === "th" ? "กำลังโหลดเอกสาร…" : "Loading document…"}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const wordCount = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length

  return (
    <div style={{ margin: "-20px -32px", height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Top header bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", background: "var(--bg-main)", borderBottom: "1px solid var(--bg-border)", flexShrink: 0 }}>
        <button
          onClick={() => router.push("/documents")}
          style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg-icon)", border: "1px solid var(--bg-border)", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={14} />
        </button>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => save()}
          placeholder={lang === "th" ? "ชื่อเอกสาร" : "Document title"}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 17, fontWeight: 700, color: "var(--tx-main)", minWidth: 0 }}
        />

        {/* Mode toggle */}
        <div style={{ display: "flex", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 9, padding: 2, gap: 2 }}>
          {([["ai", lang === "th" ? "โหมด AI" : "AI Mode", Sparkles], ["manual", lang === "th" ? "แก้ไข" : "Edit", Pencil]] as const).map(([mode, label, Icon]) => (
            <button key={mode} onClick={() => setEditMode(mode)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: editMode === mode ? "rgba(99,102,241,0.2)" : "transparent", border: "none", color: editMode === mode ? "#a5b4fc" : "var(--tx-dim)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ExportMenu onExport={handleExport} />
          <button
            onClick={() => save()}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, background: saved ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.12)", border: `1px solid ${saved ? "rgba(16,185,129,0.28)" : "rgba(99,102,241,0.28)"}`, color: saved ? "#34d399" : "#a5b4fc", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {saved ? <CheckCircle size={12} /> : saving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={12} />}
            {saved ? (lang === "th" ? "บันทึกแล้ว" : "Saved") : saving ? (lang === "th" ? "กำลังบันทึก…" : "Saving…") : (lang === "th" ? "บันทึก" : "Save")}
          </button>
        </div>
      </div>

      {/* ── Body: Editor + AI Panel ── */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* ── Left: Editor Column ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>

          {/* Format toolbar (manual mode only) */}
          {editMode === "manual" && (
            <EditorToolbar
              getEditorDiv={() => editorRef.current?.getDiv() ?? null}
              onChange={handleToolbarChange}
            />
          )}

          {/* AI mode hint bar */}
          {editMode === "ai" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 24px", background: "rgba(99,102,241,0.05)", borderBottom: "1px solid rgba(99,102,241,0.1)", flexShrink: 0 }}>
              <Sparkles size={12} color="#6366f1" />
              <span style={{ fontSize: 12, color: "#7c86d4" }}>
                {lang === "th" ? "เลือกข้อความเพื่อให้ AI ช่วยแก้ไข · ใช้แผงด้านขวาเพื่อสั่ง AI" : "Select text for AI to edit · Use the right panel to instruct AI"}
              </span>
              <span style={{ fontSize: 11, color: "var(--tx-faint)", marginLeft: "auto" }}>
                <kbd style={{ background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>#</kbd> → H1 &nbsp;
                <kbd style={{ background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>-</kbd> → Bullet
              </span>
            </div>
          )}

          {/* Editor scroll area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 56px", background: "var(--bg-deep)" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", background: "var(--bg-main)", borderRadius: 16, padding: "48px 56px", border: "1px solid var(--bg-border)", minHeight: 600, boxShadow: "0 4px 32px rgba(0,0,0,0.15)" }}>
              <DocumentEditor
                ref={editorRef}
                content={content}
                onChange={handleEditorChange}
                onSelectionChange={setSelection}
              />
            </div>
          </div>

          {/* Word count bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 24px", background: "var(--bg-main)", borderTop: "1px solid var(--bg-border)", flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "var(--tx-faint)" }}>{wordCount.toLocaleString()} {lang === "th" ? "คำ" : "words"}</span>
            <span style={{ fontSize: 11, color: "var(--tx-faint)" }}>
              {doc.updated_at ? new Date(doc.updated_at).toLocaleString("th-TH") : ""}
            </span>
          </div>
        </div>

        {/* ── Right: AI Chat Panel ── */}
        <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--bg-sidebar-solid)", borderLeft: "1px solid var(--bg-border)", overflow: "hidden" }}>

          {/* Panel header */}
          <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--bg-border)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={15} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-main)" }}>ATLAS AI</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "aipulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>Ready</span>
                </div>
              </div>
              <button style={{ marginLeft: "auto", width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", color: "var(--tx-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MoreHorizontal size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Welcome message */}
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 12px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Sparkles size={20} color="#6366f1" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx-primary)", marginBottom: 6 }}>
                  {lang === "th" ? "สวัสดี! ฉัน ATLAS AI" : "Hi! I'm ATLAS AI"}
                </div>
                <div style={{ fontSize: 12, color: "var(--tx-dim)", lineHeight: 1.6 }}>
                  {lang === "th" ? "บอกฉันว่าต้องการให้แก้ไข เพิ่ม หรือปรับปรุงส่วนใดของเอกสาร" : "Tell me what to edit, add, or improve in this document"}
                </div>
              </div>
            )}

            {/* Quick prompts (visible when no messages) */}
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {QUICK_PROMPTS[lang].map((p, i) => (
                  <button key={i}
                    onClick={() => { setChatInput(p) }}
                    style={{ textAlign: "left", padding: "8px 12px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)", borderRadius: 10, color: "var(--tx-muted)", fontSize: 12, cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.14)"; e.currentTarget.style.color = "#a5b4fc" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.07)"; e.currentTarget.style.color = "var(--tx-muted)" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Message history */}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: msg.role === "user" ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  {msg.role === "user" ? <User size={12} color="#a5b4fc" /> : <Bot size={12} color="#fff" />}
                </div>
                <div style={{
                  maxWidth: "82%", padding: "8px 12px", borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                  background: msg.role === "user" ? "rgba(99,102,241,0.12)" : "var(--bg-card)",
                  border: `1px solid ${msg.role === "user" ? "rgba(99,102,241,0.2)" : "var(--bg-border)"}`,
                  fontSize: 12.5, color: "var(--tx-primary)", lineHeight: 1.6,
                }}>
                  {msg.loading
                    ? <span style={{ display: "flex", gap: 4, alignItems: "center" }}>{[0,1,2].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", display: "inline-block", animation: `dotBounce .8s ease-in-out ${d * 0.2}s infinite alternate` }} />)}</span>
                    : msg.text
                  }
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: "12px 14px 16px", borderTop: "1px solid var(--bg-border)", flexShrink: 0 }}>
            <form onSubmit={handleChat} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat() } }}
                  placeholder={lang === "th" ? "สั่ง AI เช่น เพิ่มส่วนสรุป…" : "Instruct AI, e.g. Add a conclusion section…"}
                  rows={1}
                  disabled={chatLoading}
                  style={{ width: "100%", background: "var(--bg-input)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "10px 14px", color: "var(--tx-primary)", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", caretColor: "#6366f1" }}
                  onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.2)"}
                />
              </div>
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: chatInput.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--bg-icon)", border: "none", cursor: chatInput.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: chatInput.trim() ? "0 4px 16px rgba(99,102,241,0.35)" : "none" }}
              >
                {chatLoading
                  ? <Loader2 size={15} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={14} color={chatInput.trim() ? "#fff" : "var(--tx-faint)"} />
                }
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Floating AI Toolbar ── */}
      {selection && !floatingLoading && (
        <FloatingAIToolbar
          position={selection.position}
          onAction={handleFloatingAction}
          loading={false}
        />
      )}
      {floatingLoading && selection && (
        <FloatingAIToolbar
          position={selection.position}
          onAction={() => {}}
          loading={true}
        />
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes aipulse { 0%,100%{opacity:1;box-shadow:0 0 5px #10b981} 50%{opacity:0.5;box-shadow:0 0 10px #10b981} }
        @keyframes dotBounce { from{transform:translateY(0);opacity:.5} to{transform:translateY(-5px);opacity:1} }
      `}</style>
    </div>
  )
}
