export default function AILoadingDots({ label = "AI กำลังสร้างเนื้อหา…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, width: "fit-content" }}>
      <span className="ai-dot" />
      <span className="ai-dot" />
      <span className="ai-dot" />
      <span style={{ color: "var(--tx-muted)", fontSize: 14, marginLeft: 4 }}>{label}</span>
    </div>
  )
}
