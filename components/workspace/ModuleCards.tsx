"use client"

import Link from "next/link"
import { FileText, Table2, Presentation, FileSearch, FolderOpen, Search, Brain, Zap } from "lucide-react"

const modules = [
  {
    label: "AI Documents",
    desc: "รายงาน Proposal สัญญา Resume",
    href: "/documents",
    icon: FileText,
    color: "#6366f1",
    gradient: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))",
    border: "rgba(99,102,241,0.2)",
  },
  {
    label: "AI Sheets",
    desc: "Budget KPI CRM Inventory",
    href: "/sheets",
    icon: Table2,
    color: "#10b981",
    gradient: "linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))",
    border: "rgba(16,185,129,0.2)",
  },
  {
    label: "AI Slides",
    desc: "Pitch Deck Presentation",
    href: "/slides",
    icon: Presentation,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))",
    border: "rgba(245,158,11,0.2)",
  },
  {
    label: "AI PDF",
    desc: "สรุป ถามตอบ OCR แปลง",
    href: "/pdf",
    icon: FileSearch,
    color: "#ef4444",
    gradient: "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))",
    border: "rgba(239,68,68,0.2)",
  },
  {
    label: "AI Files",
    desc: "จัดการไฟล์ทั้งหมด",
    href: "/files",
    icon: FolderOpen,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))",
    border: "rgba(139,92,246,0.2)",
  },
  {
    label: "AI Search",
    desc: "ค้นหาด้วยภาษาคน",
    href: "/search",
    icon: Search,
    color: "#06b6d4",
    gradient: "linear-gradient(135deg,rgba(6,182,212,0.15),rgba(6,182,212,0.05))",
    border: "rgba(6,182,212,0.2)",
  },
  {
    label: "AI Knowledge",
    desc: "ข้อมูลบริษัท เทมเพลต",
    href: "/knowledge",
    icon: Brain,
    color: "#ec4899",
    gradient: "linear-gradient(135deg,rgba(236,72,153,0.15),rgba(236,72,153,0.05))",
    border: "rgba(236,72,153,0.2)",
  },
  {
    label: "AI Automation",
    desc: "Workflow อัตโนมัติ",
    href: "/automation",
    icon: Zap,
    color: "#f97316",
    gradient: "linear-gradient(135deg,rgba(249,115,22,0.15),rgba(249,115,22,0.05))",
    border: "rgba(249,115,22,0.2)",
  },
]

export default function ModuleCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
      {modules.map(mod => {
        const Icon = mod.icon
        return (
          <Link key={mod.href} href={mod.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                background: mod.gradient, border: `1px solid ${mod.border}`,
                borderRadius: 16, padding: 20, cursor: "pointer", transition: ".2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${mod.color}20` }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${mod.color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon size={18} color={mod.color} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 4 }}>{mod.label}</div>
              <div style={{ fontSize: 12, color: "var(--tx-dim)", lineHeight: 1.5 }}>{mod.desc}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
