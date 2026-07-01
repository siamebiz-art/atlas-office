"use client"

import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Undo2, Redo2, ChevronDown, Image as ImageIcon, Upload, Globe, Search } from "lucide-react"
import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

const HEADING_OPTIONS = [
  { label: "Normal", tag: "p" },
  { label: "Heading 1", tag: "h1" },
  { label: "Heading 2", tag: "h2" },
  { label: "Heading 3", tag: "h3" },
]

const FONT_OPTIONS = [
  // ── ราชการไทย ──
  { label: "TH Sarabun New ★",     value: "Sarabun, sans-serif" },
  { label: "TH Sarabun PSK",        value: "'TH Sarabun PSK', Sarabun, sans-serif" },
  { label: "TH Niramit AS",         value: "'TH Niramit AS', Sarabun, sans-serif" },
  { label: "Angsana New",           value: "'Angsana New', serif" },
  { label: "Cordia New",            value: "'Cordia New', Sarabun, sans-serif" },
  { label: "",                       value: "" },
  // ── Google Fonts ไทย ──
  { label: "Prompt — โมเดิร์น มน",       value: "Prompt, sans-serif" },
  { label: "Kanit — เรขาคณิต Bold",      value: "Kanit, sans-serif" },
  { label: "Noto Sans Thai — อ่านง่าย",  value: "'Noto Sans Thai', sans-serif" },
  { label: "IBM Plex Sans Thai — เทค",   value: "'IBM Plex Sans Thai', sans-serif" },
  { label: "",                       value: "" },
  // ── สากล ──
  { label: "Inter",                 value: "Inter, sans-serif" },
  { label: "Arial",                 value: "Arial, sans-serif" },
  { label: "Times New Roman",       value: "'Times New Roman', serif" },
  { label: "Courier New (Code)",    value: "'Courier New', monospace" },
]

const SIZE_OPTIONS = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"]

const TEXT_COLORS = [
  "#ffffff", "#e2e8f0", "#94a3b8", "#64748b",
  "#f87171", "#fb923c", "#fbbf24", "#34d399",
  "#60a5fa", "#a78bfa", "#f472b6", "#000000",
]

const HIGHLIGHT_COLORS = [
  "transparent",
  "rgba(254,240,138,0.5)", "rgba(167,243,208,0.5)", "rgba(147,197,253,0.5)",
  "rgba(249,168,212,0.5)", "rgba(196,181,253,0.5)", "rgba(253,186,116,0.5)",
]

type Props = {
  getEditorDiv: () => HTMLDivElement | null
  onChange: () => void
}

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value)
}

export default function EditorToolbar({ getEditorDiv, onChange }: Props) {
  const [headingOpen, setHeadingOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [hlOpen, setHlOpen] = useState(false)
  const [linkInput, setLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("https://")
  const [imgOpen, setImgOpen] = useState(false)
  const [imgTab, setImgTab] = useState<"upload" | "url" | "unsplash">("upload")
  const [urlInput, setUrlInput] = useState("")
  const [unsplashKw, setUnsplashKw] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedImgRange = useRef<Range | null>(null)

  function closeAllDropdowns() {
    setHeadingOpen(false); setFontOpen(false); setSizeOpen(false)
    setColorOpen(false); setHlOpen(false); setLinkInput(false); setImgOpen(false)
  }

  function btn(cmd: string, value?: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      getEditorDiv()?.focus()
      exec(cmd, value)
      onChange()
    }
  }

  function setHeading(tag: string) {
    setHeadingOpen(false)
    getEditorDiv()?.focus()
    exec("formatBlock", tag)
    onChange()
  }

  function setFont(font: string) {
    setFontOpen(false)
    getEditorDiv()?.focus()
    exec("fontName", font)
    onChange()
  }

  function setSize(size: string) {
    setSizeOpen(false)
    getEditorDiv()?.focus()
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) {
      exec("fontSize", "7")
      getEditorDiv()?.querySelectorAll("font[size='7']").forEach(el => {
        const span = document.createElement("span")
        span.style.fontSize = `${size}px`
        span.innerHTML = (el as HTMLElement).innerHTML
        el.parentNode?.replaceChild(span, el)
      })
    }
    onChange()
  }

  function setColor(color: string) {
    setColorOpen(false)
    getEditorDiv()?.focus()
    exec("foreColor", color)
    onChange()
  }

  function setHighlight(color: string) {
    setHlOpen(false)
    getEditorDiv()?.focus()
    exec("hiliteColor", color)
    onChange()
  }

  function insertLink() {
    setLinkInput(false)
    getEditorDiv()?.focus()
    exec("createLink", linkUrl)
    setLinkUrl("https://")
    onChange()
  }

  // ── Image insertion ──

  function openImg(e: React.MouseEvent) {
    e.preventDefault()
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedImgRange.current = sel.getRangeAt(0).cloneRange()
    }
    const wasOpen = imgOpen
    closeAllDropdowns()
    if (!wasOpen) setImgOpen(true)
  }

  function insertImgHtml(html: string) {
    const editorDiv = getEditorDiv()
    if (!editorDiv) return
    editorDiv.focus()
    const sel = window.getSelection()
    if (sel && savedImgRange.current) {
      sel.removeAllRanges()
      sel.addRange(savedImgRange.current)
    }
    document.execCommand("insertHTML", false, html)
    onChange()
    setImgOpen(false)
    setUrlInput("")
    setUnsplashKw("")
  }

  async function handleFileUpload(file: File) {
    if (!file.type.startsWith("image/")) return
    setUploading(true)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from("atlas-files").upload(path, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("atlas-files").getPublicUrl(data.path)
      insertImgHtml(`<img src="${urlData.publicUrl}" alt="" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" />`)
    }
    setUploading(false)
  }

  function insertFromUrl() {
    const url = urlInput.trim()
    if (!url) return
    insertImgHtml(`<img src="${url}" alt="" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" />`)
  }

  function insertFromUnsplash() {
    const kw = unsplashKw.trim()
    if (!kw) return
    const seed = Date.now() % 99999
    const url = `https://source.unsplash.com/800x500/?${encodeURIComponent(kw)}&sig=${seed}`
    insertImgHtml(`<img src="${url}" alt="${kw}" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" />`)
  }

  const sep = <div style={{ width: 1, height: 20, background: "var(--bg-border, rgba(255,255,255,0.09))", flexShrink: 0 }} />

  function Btn({ onClick, title, active, children }: { onClick: (e: React.MouseEvent) => void; title?: string; active?: boolean; children: React.ReactNode }) {
    return (
      <button
        title={title}
        onMouseDown={onClick}
        style={{ width: 30, height: 30, borderRadius: 6, background: active ? "rgba(99,102,241,0.2)" : "transparent", border: "none", color: active ? "#a5b4fc" : "var(--tx-muted, #94a3b8)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--tx-primary)" } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--tx-muted, #94a3b8)" } }}
      >
        {children}
      </button>
    )
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "6px 0", background: active ? "rgba(99,102,241,0.15)" : "transparent",
    border: "none", borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
    color: active ? "#a5b4fc" : "var(--tx-muted, #94a3b8)", fontSize: 11, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
  })

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 12px", background: "var(--bg-card, #0f0f1a)", borderBottom: "1px solid var(--bg-border, rgba(255,255,255,0.07))", flexWrap: "nowrap", overflowX: "visible", overflowY: "visible", flexShrink: 0, position: "relative", zIndex: 100 }}>

      {/* Undo / Redo */}
      <Btn onClick={btn("undo")} title="Undo"><Undo2 size={14} /></Btn>
      <Btn onClick={btn("redo")} title="Redo"><Redo2 size={14} /></Btn>
      {sep}

      {/* Heading */}
      <div style={{ position: "relative" }}>
        <button
          onMouseDown={e => { e.preventDefault(); setHeadingOpen(o => !o); setFontOpen(false); setSizeOpen(false); setColorOpen(false); setHlOpen(false); setLinkInput(false); setImgOpen(false) }}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", height: 30, borderRadius: 6, background: "transparent", border: "none", color: "var(--tx-muted, #94a3b8)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Normal <ChevronDown size={11} />
        </button>
        {headingOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "var(--bg-main, #0f0f1a)", border: "1px solid var(--bg-border, rgba(255,255,255,0.1))", borderRadius: 10, overflow: "hidden", zIndex: 200, minWidth: 130, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            {HEADING_OPTIONS.map(h => (
              <button key={h.tag} onMouseDown={e => { e.preventDefault(); setHeading(h.tag) }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: "transparent", border: "none", color: "var(--tx-primary, #e2e8f0)", cursor: "pointer", fontSize: h.tag === "h1" ? 18 : h.tag === "h2" ? 15 : h.tag === "h3" ? 13 : 12, fontWeight: h.tag !== "p" ? 700 : 400 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >{h.label}</button>
            ))}
          </div>
        )}
      </div>
      {sep}

      {/* Font Family */}
      <div style={{ position: "relative" }}>
        <button
          onMouseDown={e => { e.preventDefault(); setFontOpen(o => !o); setHeadingOpen(false); setSizeOpen(false); setColorOpen(false); setHlOpen(false); setLinkInput(false); setImgOpen(false) }}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", height: 30, borderRadius: 6, background: "transparent", border: "none", color: "var(--tx-muted, #94a3b8)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Font <ChevronDown size={11} />
        </button>
        {fontOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "var(--bg-main, #0f0f1a)", border: "1px solid var(--bg-border, rgba(255,255,255,0.1))", borderRadius: 10, overflow: "hidden", zIndex: 200, minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            {FONT_OPTIONS.map((f, i) => f.value === "" ? (
              <div key={i} style={{ height: 1, background: "var(--bg-border, rgba(255,255,255,0.08))", margin: "2px 0" }} />
            ) : (
              <button key={f.value} onMouseDown={e => { e.preventDefault(); setFont(f.value) }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 14px", background: "transparent", border: "none", color: "var(--tx-primary, #1e293b)", cursor: "pointer", fontSize: 13, fontFamily: f.value }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size */}
      <div style={{ position: "relative" }}>
        <button
          onMouseDown={e => { e.preventDefault(); setSizeOpen(o => !o); setHeadingOpen(false); setFontOpen(false); setColorOpen(false); setHlOpen(false); setLinkInput(false); setImgOpen(false) }}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", height: 30, borderRadius: 6, background: "transparent", border: "none", color: "var(--tx-muted, #94a3b8)", fontSize: 12, cursor: "pointer" }}
        >
          16 <ChevronDown size={11} />
        </button>
        {sizeOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "var(--bg-main, #0f0f1a)", border: "1px solid var(--bg-border, rgba(255,255,255,0.1))", borderRadius: 10, overflow: "hidden", zIndex: 200, minWidth: 80, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxHeight: 220, overflowY: "auto" }}>
            {SIZE_OPTIONS.map(s => (
              <button key={s} onMouseDown={e => { e.preventDefault(); setSize(s) }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", background: "transparent", border: "none", color: "var(--tx-primary, #e2e8f0)", cursor: "pointer", fontSize: 13 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >{s}</button>
            ))}
          </div>
        )}
      </div>
      {sep}

      {/* Bold / Italic / Underline / Strike */}
      <Btn onClick={btn("bold")} title="Bold (Ctrl+B)"><Bold size={14} /></Btn>
      <Btn onClick={btn("italic")} title="Italic (Ctrl+I)"><Italic size={14} /></Btn>
      <Btn onClick={btn("underline")} title="Underline (Ctrl+U)"><Underline size={14} /></Btn>
      <Btn onClick={btn("strikeThrough")} title="Strikethrough"><Strikethrough size={14} /></Btn>
      {sep}

      {/* Text color */}
      <div style={{ position: "relative" }}>
        <button
          onMouseDown={e => { e.preventDefault(); setColorOpen(o => !o); setHeadingOpen(false); setFontOpen(false); setSizeOpen(false); setHlOpen(false); setLinkInput(false); setImgOpen(false) }}
          title="Text Color"
          style={{ width: 30, height: 30, borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "var(--tx-muted, #94a3b8)" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>A</span>
          <div style={{ width: 18, height: 3, background: "#6366f1", borderRadius: 1 }} />
        </button>
        {colorOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "var(--bg-main, #0f0f1a)", border: "1px solid var(--bg-border, rgba(255,255,255,0.1))", borderRadius: 10, padding: 10, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
              {TEXT_COLORS.map(c => (
                <button key={c} onMouseDown={e => { e.preventDefault(); setColor(c) }}
                  style={{ width: 22, height: 22, borderRadius: 5, background: c === "#ffffff" ? "rgba(255,255,255,0.9)" : c, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight */}
      <div style={{ position: "relative" }}>
        <button
          onMouseDown={e => { e.preventDefault(); setHlOpen(o => !o); setHeadingOpen(false); setFontOpen(false); setSizeOpen(false); setColorOpen(false); setLinkInput(false); setImgOpen(false) }}
          title="Highlight Color"
          style={{ width: 30, height: 30, borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "var(--tx-muted, #94a3b8)" }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>H</span>
          <div style={{ width: 18, height: 3, background: "rgba(254,240,138,0.8)", borderRadius: 1 }} />
        </button>
        {hlOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "var(--bg-main, #0f0f1a)", border: "1px solid var(--bg-border, rgba(255,255,255,0.1))", borderRadius: 10, padding: 10, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
              {HIGHLIGHT_COLORS.map((c, i) => (
                <button key={i} onMouseDown={e => { e.preventDefault(); setHighlight(c) }}
                  style={{ width: 24, height: 24, borderRadius: 5, background: c === "transparent" ? "rgba(255,255,255,0.05)" : c, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", position: "relative" }}
                >
                  {c === "transparent" && <span style={{ position: "absolute", inset: 2, border: "1px solid rgba(255,0,0,0.4)", borderRadius: 3, background: "linear-gradient(to bottom right, transparent calc(50% - 0.5px), rgba(255,0,0,0.5) calc(50% - 0.5px), rgba(255,0,0,0.5) calc(50% + 0.5px), transparent calc(50% + 0.5px))" }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {sep}

      {/* Align */}
      <Btn onClick={btn("justifyLeft")} title="Align Left"><AlignLeft size={14} /></Btn>
      <Btn onClick={btn("justifyCenter")} title="Align Center"><AlignCenter size={14} /></Btn>
      <Btn onClick={btn("justifyRight")} title="Align Right"><AlignRight size={14} /></Btn>
      {sep}

      {/* Lists */}
      <Btn onClick={btn("insertUnorderedList")} title="Bullet List"><List size={14} /></Btn>
      <Btn onClick={btn("insertOrderedList")} title="Numbered List"><ListOrdered size={14} /></Btn>
      {sep}

      {/* Link */}
      <div style={{ position: "relative" }}>
        <Btn onClick={e => { e.preventDefault(); setLinkInput(o => !o); setImgOpen(false) }} title="Insert Link"><Link size={14} /></Btn>
        {linkInput && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: -60, background: "var(--bg-main, #0f0f1a)", border: "1px solid var(--bg-border, rgba(255,255,255,0.1))", borderRadius: 10, padding: "10px 12px", zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", display: "flex", gap: 6, alignItems: "center", minWidth: 280 }}>
            <input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && insertLink()}
              placeholder="https://"
              autoFocus
              style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 7, padding: "5px 10px", color: "var(--tx-primary)", fontSize: 12, outline: "none" }}
            />
            <button
              onMouseDown={e => { e.preventDefault(); insertLink() }}
              style={{ padding: "5px 12px", background: "#6366f1", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, cursor: "pointer" }}
            >OK</button>
          </div>
        )}
      </div>

      {/* ── Image ── */}
      <div style={{ position: "relative" }}>
        <Btn onClick={openImg} title="แทรกรูปภาพ" active={imgOpen}>
          <ImageIcon size={14} />
        </Btn>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
            e.target.value = ""
          }}
        />

        {imgOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg-main, #0f0f1a)", border: "1px solid var(--bg-border, rgba(255,255,255,0.12))", borderRadius: 12, zIndex: 300, boxShadow: "0 12px 40px rgba(0,0,0,0.55)", width: 300, overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "10px 14px 0", fontSize: 12, fontWeight: 700, color: "var(--tx-primary)" }}>
              แทรกรูปภาพ
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--bg-border, rgba(255,255,255,0.08))", margin: "8px 0 0" }}>
              <button style={tabStyle(imgTab === "upload")} onMouseDown={e => { e.preventDefault(); setImgTab("upload") }}>
                <Upload size={11} /> อัพโหลด
              </button>
              <button style={tabStyle(imgTab === "url")} onMouseDown={e => { e.preventDefault(); setImgTab("url") }}>
                <Globe size={11} /> URL
              </button>
              <button style={tabStyle(imgTab === "unsplash")} onMouseDown={e => { e.preventDefault(); setImgTab("unsplash") }}>
                <Search size={11} /> Unsplash
              </button>
            </div>

            {/* Tab content */}
            <div style={{ padding: 14 }}>

              {/* ── Upload tab ── */}
              {imgTab === "upload" && (
                <div>
                  <div
                    onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click() }}
                    style={{ border: "2px dashed rgba(99,102,241,0.35)", borderRadius: 10, padding: "20px 14px", textAlign: "center", cursor: "pointer", background: "rgba(99,102,241,0.04)", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.65)"; e.currentTarget.style.background = "rgba(99,102,241,0.08)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; e.currentTarget.style.background = "rgba(99,102,241,0.04)" }}
                  >
                    {uploading ? (
                      <div style={{ color: "#a5b4fc", fontSize: 12 }}>กำลังอัพโหลด…</div>
                    ) : (
                      <>
                        <Upload size={20} color="#6366f1" style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontSize: 12, color: "var(--tx-primary)", fontWeight: 600, marginBottom: 4 }}>คลิกเลือกรูปภาพ</div>
                        <div style={{ fontSize: 11, color: "var(--tx-faint)" }}>JPG, PNG, GIF, WebP</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── URL tab ── */}
              {imgTab === "url" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && insertFromUrl()}
                    placeholder="https://example.com/image.jpg"
                    autoFocus
                    style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "8px 10px", color: "var(--tx-primary)", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={e => e.target.style.borderColor = "var(--bg-border)"}
                  />
                  {urlInput && (
                    <img
                      src={urlInput}
                      alt="preview"
                      style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, background: "var(--bg-card)" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    />
                  )}
                  <button
                    onMouseDown={e => { e.preventDefault(); insertFromUrl() }}
                    disabled={!urlInput.trim()}
                    style={{ padding: "8px 0", background: urlInput.trim() ? "#6366f1" : "rgba(99,102,241,0.25)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: urlInput.trim() ? "pointer" : "not-allowed" }}
                  >
                    แทรกรูปภาพ
                  </button>
                </div>
              )}

              {/* ── Unsplash tab ── */}
              {imgTab === "unsplash" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--tx-muted)" }}>พิมพ์ keyword ภาษาอังกฤษ</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={unsplashKw}
                      onChange={e => setUnsplashKw(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && insertFromUnsplash()}
                      placeholder="เช่น nature, city, office…"
                      autoFocus
                      style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "7px 10px", color: "var(--tx-primary)", fontSize: 12, outline: "none" }}
                      onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                      onBlur={e => e.target.style.borderColor = "var(--bg-border)"}
                    />
                  </div>
                  {unsplashKw && (
                    <img
                      src={`https://source.unsplash.com/560x200/?${encodeURIComponent(unsplashKw)}&sig=${Math.floor(Date.now() / 10000)}`}
                      alt="unsplash preview"
                      style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }}
                    />
                  )}
                  <button
                    onMouseDown={e => { e.preventDefault(); insertFromUnsplash() }}
                    disabled={!unsplashKw.trim()}
                    style={{ padding: "8px 0", background: unsplashKw.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.2)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: unsplashKw.trim() ? "pointer" : "not-allowed" }}
                  >
                    แทรกจาก Unsplash
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
