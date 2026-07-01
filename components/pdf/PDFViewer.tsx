"use client"

import { useState } from "react"
import { ZoomIn, ZoomOut } from "lucide-react"

export default function PDFViewer({ url, name }: { url: string; name: string }) {
  const [scale, setScale] = useState(100)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-deep, var(--bg-main))" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--tx-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <button onClick={() => setScale(s => Math.max(50, s - 25))} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-card-hover)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ZoomOut size={13} />
        </button>
        <span style={{ fontSize: 12, color: "var(--tx-faint)", minWidth: 40, textAlign: "center" }}>{scale}%</span>
        <button onClick={() => setScale(s => Math.min(200, s + 25))} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-card-hover)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ZoomIn size={13} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <iframe
          src={`${url}#toolbar=0`}
          style={{ width: `${scale}%`, minWidth: "100%", height: "100%", minHeight: 600, border: "none", borderRadius: 12 }}
          title={name}
        />
      </div>
    </div>
  )
}
