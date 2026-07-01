"use client"

import Link from "next/link"
import { FileText, MoreVertical, Trash2 } from "lucide-react"
import { useState } from "react"
import { formatDate } from "@/lib/utils"
import type { Document } from "@/types"

const typeLabels: Record<string, string> = {
  report: "รายงาน", proposal: "Proposal", quotation: "ใบเสนอราคา",
  invoice: "ใบแจ้งหนี้", contract: "สัญญา", "meeting-notes": "บันทึกการประชุม",
  sop: "SOP", resume: "Resume", "cover-letter": "Cover Letter",
  "business-plan": "Business Plan", "marketing-plan": "Marketing Plan", general: "ทั่วไป",
}

export default function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      style={{ background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 16, overflow: "hidden", transition: ".2s", position: "relative" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.1)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
    >
      <Link href={`/documents/${doc.id}`} style={{ textDecoration: "none", display: "block", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={16} color="#6366f1" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
            <div style={{ fontSize: 12, color: "var(--tx-faint)", marginTop: 3 }}>{typeLabels[doc.doc_type] ?? doc.doc_type}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--tx-muted)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, lineHeight: 1.6, marginBottom: 12 }}>
          {doc.content.replace(/<[^>]*>/g, "").slice(0, 120) || "ยังไม่มีเนื้อหา"}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "var(--tx-faint)" }}>{formatDate(doc.updated_at)}</span>
          <span style={{ fontSize: 11, color: "var(--tx-faint)" }}>{doc.word_count} คำ</span>
        </div>
      </Link>

      {/* Menu button */}
      <button
        onClick={e => { e.preventDefault(); setMenuOpen(p => !p) }}
        style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: "none", border: "none", color: "var(--tx-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <MoreVertical size={14} />
      </button>

      {menuOpen && (
        <div style={{ position: "absolute", top: 44, right: 12, background: "var(--bg-dropdown)", border: "1px solid var(--bg-border)", borderRadius: 10, zIndex: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <button
            onClick={() => { onDelete(doc.id); setMenuOpen(false) }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "none", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", width: "100%" }}
          >
            <Trash2 size={12} />
            ลบ
          </button>
        </div>
      )}
    </div>
  )
}
