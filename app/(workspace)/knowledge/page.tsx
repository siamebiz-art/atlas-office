"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Brain, Save, CheckCircle } from "lucide-react"

const fields = [
  { key: "company_name",     label: "ชื่อบริษัท / ร้านค้า",        placeholder: "บริษัท ABC จำกัด",          type: "text" },
  { key: "company_address",  label: "ที่อยู่",                       placeholder: "123/45 ถนน...",              type: "textarea" },
  { key: "company_phone",    label: "เบอร์โทร",                      placeholder: "02-xxx-xxxx",                type: "text" },
  { key: "company_email",    label: "อีเมลบริษัท",                   placeholder: "info@company.com",           type: "text" },
  { key: "company_website",  label: "เว็บไซต์",                      placeholder: "https://www.company.com",   type: "text" },
  { key: "company_tax_id",   label: "เลขประจำตัวผู้เสียภาษี",       placeholder: "0000000000000",              type: "text" },
  { key: "company_vat",      label: "VAT",                            placeholder: "7%",                         type: "text" },
  { key: "default_font",     label: "ฟอนต์หลัก",                     placeholder: "Sarabun, Noto Sans Thai",   type: "text" },
  { key: "brand_primary_color", label: "สีหลักของแบรนด์",           placeholder: "#6366f1",                    type: "text" },
  { key: "signature_name",   label: "ชื่อผู้ลงนาม",                  placeholder: "นาย ก ข ค",                 type: "text" },
  { key: "signature_position", label: "ตำแหน่ง",                    placeholder: "กรรมการผู้จัดการ",           type: "text" },
  { key: "payment_terms",    label: "เงื่อนไขการชำระเงิน",           placeholder: "ชำระภายใน 30 วัน",          type: "text" },
  { key: "bank_account",     label: "บัญชีธนาคาร",                   placeholder: "ธนาคาร XXX เลขบัญชี xxx",  type: "text" },
]

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)",
  borderRadius: 10, padding: "10px 14px", color: "var(--tx-main)",
  fontSize: 14, outline: "none", boxSizing: "border-box",
}

export default function KnowledgePage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("knowledge_items").select("key,value").eq("user_id", user.id)
      if (data) {
        const map: Record<string, string> = {}
        data.forEach(item => { map[item.key] = item.value })
        setValues(map)
      }
    }
    load()
  }, [])

  async function saveAll() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    for (const [key, value] of Object.entries(values)) {
      if (!value) continue
      await supabase.from("knowledge_items").upsert(
        { user_id: user.id, key, value, item_type: "text" },
        { onConflict: "user_id,key" }
      )
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = "rgba(236,72,153,0.45)"
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = "var(--bg-border)"
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--tx-main)" }}>AI Knowledge</h2>
          <p style={{ color: "var(--tx-dim)", fontSize: 14 }}>AI จะใช้ข้อมูลนี้กรอกเอกสารทั้งหมดให้อัตโนมัติ</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: saved ? "rgba(236,72,153,0.15)" : "linear-gradient(135deg,#ec4899,#be185d)", border: saved ? "1px solid rgba(236,72,153,0.35)" : "none", borderRadius: 12, color: saved ? "#f472b6" : "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? "บันทึกแล้ว" : saving ? "กำลังบันทึก…" : "บันทึกทั้งหมด"}
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 14, padding: "14px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
        <Brain size={18} color="#ec4899" />
        <p style={{ fontSize: 14, color: "var(--tx-muted)", lineHeight: 1.6 }}>
          เมื่อกรอกข้อมูลด้านล่าง AI จะนำไปใช้ใน{" "}
          <strong style={{ color: "var(--tx-primary)" }}>ทุกเอกสาร</strong>{" "}
          ที่สร้างโดยอัตโนมัติ — ชื่อบริษัท ที่อยู่ ลายเซ็น ฯลฯ
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {fields.map(field => (
          <div key={field.key} style={field.type === "textarea" ? { gridColumn: "1/-1" } : {}}>
            <label style={{ display: "block", fontSize: 13, color: "var(--tx-muted)", marginBottom: 6, fontWeight: 500 }}>{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.key] ?? ""}
                onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            ) : (
              <input
                type="text"
                value={values[field.key] ?? ""}
                onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
