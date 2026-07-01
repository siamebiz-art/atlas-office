"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Zap, Plus, Play, Pause, Trash2, ChevronRight } from "lucide-react"
import type { Automation, AutomationStep } from "@/types"

const stepTypes = [
  { key: "generate-doc",    label: "สร้างเอกสาร", color: "#6366f1" },
  { key: "generate-sheet",  label: "สร้างตาราง",  color: "#10b981" },
  { key: "generate-slides", label: "สร้าง Slides", color: "#f59e0b" },
  { key: "export-pdf",      label: "Export PDF",   color: "#ef4444" },
  { key: "export-docx",     label: "Export DOCX",  color: "#8b5cf6" },
  { key: "save-file",       label: "บันทึกไฟล์",  color: "#06b6d4" },
]

const DEFAULT_STEPS: AutomationStep[] = [
  { id: "1", type: "generate-doc",  config: { prompt: "สร้าง Proposal" }, label: "สร้างเอกสาร" },
  { id: "2", type: "export-pdf",    config: {},                             label: "Export PDF" },
  { id: "3", type: "save-file",     config: {},                             label: "บันทึกไฟล์" },
]

export default function AutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading]         = useState(true)
  const [creating, setCreating]       = useState(false)
  const [newName, setNewName]         = useState("")
  const [running, setRunning]         = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("automations").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      setAutomations(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function createAutomation() {
    if (!newName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("automations").insert({
      user_id: user.id, name: newName, steps: DEFAULT_STEPS, trigger_type: "manual", is_active: true,
    }).select().single()
    if (data) setAutomations(prev => [data, ...prev])
    setNewName("")
    setCreating(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("automations").update({ is_active: !current }).eq("id", id)
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a))
  }

  async function runNow(id: string) {
    setRunning(id)
    await fetch(`/api/automations/${id}/run`, { method: "POST" })
    await supabase.from("automations").update({ last_run_at: new Date().toISOString() }).eq("id", id)
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, last_run_at: new Date().toISOString() } : a))
    setRunning(null)
  }

  async function deleteAuto(id: string) {
    await supabase.from("automations").delete().eq("id", id)
    setAutomations(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--tx-main)" }}>AI Automation</h2>
          <p style={{ color: "var(--tx-dim)", fontSize: 14 }}>สร้าง Workflow อัตโนมัติ — สั่งครั้งเดียว ทำทุกขั้นตอน</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg,#f97316,#ea580c)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <Plus size={15} />
          สร้าง Workflow
        </button>
      </div>

      {/* New workflow dialog */}
      {creating && (
        <div style={{ background: "var(--bg-main)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 4px 24px rgba(249,115,22,0.08)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#fb923c" }}>สร้าง Workflow ใหม่</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && createAutomation()}
            placeholder="ชื่อ Workflow เช่น 'สร้าง Proposal แล้ว Export PDF'"
            style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "10px 14px", color: "var(--tx-main)", fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = "rgba(249,115,22,0.4)"}
            onBlur={e => e.target.style.borderColor = "var(--bg-border)"}
          />
          <div style={{ fontSize: 12, color: "var(--tx-dim)", marginBottom: 16 }}>Workflow จะมีขั้นตอนเริ่มต้น: สร้างเอกสาร → Export PDF → บันทึกไฟล์</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={createAutomation} style={{ padding: "8px 20px", background: "linear-gradient(135deg,#f97316,#ea580c)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>สร้าง</button>
            <button onClick={() => setCreating(false)} style={{ padding: "8px 20px", background: "var(--bg-card-hover)", border: "1px solid var(--bg-border)", borderRadius: 8, color: "var(--tx-muted)", cursor: "pointer" }}>ยกเลิก</button>
          </div>
        </div>
      )}

      {loading ? null : automations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <Zap size={48} color="var(--tx-faint)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--tx-muted)", marginBottom: 8 }}>ยังไม่มี Workflow</h3>
          <p style={{ color: "var(--tx-faint)" }}>สร้าง Workflow อัตโนมัติเพื่อลดงานซ้ำซ้อน</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {automations.map(auto => (
            <div
              key={auto.id}
              style={{ background: "var(--bg-main)", border: `1px solid ${auto.is_active ? "rgba(249,115,22,0.22)" : "var(--bg-border)"}`, borderRadius: 16, padding: 20, transition: ".2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,115,22,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: auto.is_active ? "rgba(249,115,22,0.12)" : "var(--bg-icon)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={16} color={auto.is_active ? "#f97316" : "var(--tx-faint)"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-primary)" }}>{auto.name}</div>
                  <div style={{ fontSize: 12, color: "var(--tx-faint)" }}>
                    {auto.steps?.length ?? 0} ขั้นตอน · {auto.last_run_at ? `รันล่าสุด ${new Date(auto.last_run_at).toLocaleString("th-TH")}` : "ยังไม่เคยรัน"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => runNow(auto.id)}
                    disabled={running === auto.id}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, color: "#fb923c", fontSize: 12, cursor: "pointer" }}
                  >
                    <Play size={11} />
                    {running === auto.id ? "กำลังรัน…" : "รันเดี๋ยวนี้"}
                  </button>
                  <button
                    onClick={() => toggleActive(auto.id, auto.is_active)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-card-hover)", border: "1px solid var(--bg-border)", color: auto.is_active ? "#fb923c" : "var(--tx-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {auto.is_active ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                  <button
                    onClick={() => deleteAuto(auto.id)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Steps visualization */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {(auto.steps ?? []).map((step, i) => {
                  const st = stepTypes.find(t => t.key === step.type)
                  return (
                    <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ padding: "4px 10px", background: `${st?.color ?? "#64748b"}15`, border: `1px solid ${st?.color ?? "#64748b"}30`, borderRadius: 6, fontSize: 11, color: st?.color ?? "var(--tx-dim)", fontWeight: 500 }}>
                        {step.label}
                      </div>
                      {i < (auto.steps?.length ?? 0) - 1 && <ChevronRight size={12} color="var(--tx-faint)" />}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
