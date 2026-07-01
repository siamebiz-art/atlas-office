"use client"

import { useState } from "react"
import { Search, FileText, Table2, Presentation, Loader2 } from "lucide-react"
import Link from "next/link"

type Result = { id: string; title: string; snippet: string; type: string; href: string }

const typeIcon: Record<string, React.ReactNode> = {
  document: <FileText size={14} color="#6366f1" />,
  sheet:    <Table2 size={14} color="#10b981" />,
  slide:    <Presentation size={14} color="#f59e0b" />,
}

export default function SearchPage() {
  const [query, setQuery]     = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const res = await fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
    const data = await res.json()
    setResults(data.results ?? [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--tx-main)" }}>AI Search</h2>
      <p style={{ color: "var(--tx-dim)", fontSize: 14, marginBottom: 28 }}>ค้นหาด้วยภาษาคน — ไม่ต้องจำชื่อไฟล์</p>

      <form onSubmit={handleSearch} style={{ position: "relative", marginBottom: 32 }}>
        <Search size={18} color="var(--tx-dim)" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='เช่น "ใบเสนอราคาที่ทำให้บริษัท ABC เดือนก่อน"'
          style={{ width: "100%", padding: "16px 52px 16px 52px", background: "var(--bg-input)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 16, color: "var(--tx-main)", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.25)"}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", padding: "8px 16px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "ค้นหา"}
        </button>
      </form>

      {searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--tx-muted)" }}>ไม่พบผลลัพธ์สำหรับ "{query}"</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map(r => (
          <Link key={r.id} href={r.href} style={{ textDecoration: "none" }}>
            <div
              style={{ background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 14, padding: "16px 20px", cursor: "pointer", transition: ".15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.08)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.boxShadow = "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {typeIcon[r.type] ?? <FileText size={14} color="var(--tx-dim)" />}
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-primary)" }}>{r.title}</span>
                <span style={{ fontSize: 11, color: "var(--tx-faint)", marginLeft: "auto" }}>{r.type}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--tx-dim)", lineHeight: 1.6 }}>{r.snippet}</p>
            </div>
          </Link>
        ))}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
