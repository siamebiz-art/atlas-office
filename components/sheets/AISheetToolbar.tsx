"use client"

import { Wand2, TrendingUp, RefreshCw, Loader2 } from "lucide-react"

type Props = { onAction: (action: string) => void; loading: boolean }

const actions = [
  { key: "fill", label: "เติมข้อมูล AI", icon: Wand2 },
  { key: "chart", label: "แนะนำ Chart", icon: TrendingUp },
  { key: "formula", label: "เพิ่มสูตร", icon: RefreshCw },
]

export default function AISheetToolbar({ onAction, loading }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontSize: 13 }}>
          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          AI กำลังสร้าง…
        </div>
      ) : actions.map(a => {
        const Icon = a.icon
        return (
          <button key={a.key} onClick={() => onAction(a.key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "#34d399", fontSize: 12, cursor: "pointer" }}>
            <Icon size={12} />
            {a.label}
          </button>
        )
      })}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
