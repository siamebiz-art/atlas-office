"use client"

import { useState } from "react"
import { Download, ChevronDown, FileText, FileDown, Code, Globe } from "lucide-react"

type Props = {
  onExport: (format: "docx" | "pdf" | "markdown" | "html") => void
  loading?: boolean
}

const formats = [
  { key: "docx" as const, label: "Word (.docx)", icon: FileText, color: "#6366f1" },
  { key: "pdf" as const, label: "PDF", icon: FileDown, color: "#ef4444" },
  { key: "markdown" as const, label: "Markdown (.md)", icon: Code, color: "#10b981" },
  { key: "html" as const, label: "HTML", icon: Globe, color: "#f59e0b" },
]

export default function ExportMenu({ onExport, loading }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(p => !p)}
        disabled={loading}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg-card-hover)", border: "1px solid var(--bg-border)", borderRadius: 10, color: "var(--tx-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
      >
        <Download size={13} />
        Export
        <ChevronDown size={12} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg-dropdown)", border: "1px solid var(--bg-dropdown-border)", borderRadius: 12, padding: 6, zIndex: 50, minWidth: 180 }}>
          {formats.map(fmt => {
            const Icon = fmt.icon
            return (
              <button
                key={fmt.key}
                onClick={() => { onExport(fmt.key); setOpen(false) }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 8, background: "none", border: "none", color: "var(--tx-muted)", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--tx-primary)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--tx-muted)" }}
              >
                <Icon size={13} color={fmt.color} />
                {fmt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
