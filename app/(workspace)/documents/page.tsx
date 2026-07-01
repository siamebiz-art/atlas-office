"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DocumentCard from "@/components/documents/DocumentCard"
import AILoadingDots from "@/components/shared/AILoadingDots"
import type { Document, DocType } from "@/types"
import { useLang } from "@/contexts/LanguageContext"

function DocumentsPage() {
  const { lang } = useLang()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const loadDocs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("documents").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  // Auto-create from workspace AI prompt
  useEffect(() => {
    const prompt = searchParams.get("prompt")
    const type = searchParams.get("type") as DocType | null
    if (prompt && !creating) {
      createWithAI(prompt, type ?? "general")
    }
  }, [])

  async function createWithAI(prompt: string, docType: DocType = "general") {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const res = await fetch("/api/ai/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, docType, action: "generate" }),
    })
    const { content, title } = await res.json()

    const { data } = await supabase.from("documents").insert({
      user_id: user.id,
      title: title || prompt.slice(0, 60),
      content,
      doc_type: docType,
      word_count: content.split(/\s+/).length,
    }).select().single()

    if (data) router.push(`/documents/${data.id}`)
    setCreating(false)
  }

  async function createBlank() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("documents").insert({
      user_id: user.id, title: "เอกสารใหม่", content: "", doc_type: "general", word_count: 0,
    }).select().single()
    if (data) router.push(`/documents/${data.id}`)
  }

  async function deleteDoc(id: string) {
    await supabase.from("documents").delete().eq("id", id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--tx-main)" }}>AI Documents</h2>
          <p style={{ color: "var(--tx-dim)", fontSize: 14 }}>{lang === "th" ? "สร้างและจัดการเอกสารด้วย AI" : "Create and manage documents with AI"}</p>
        </div>
        <button
          onClick={createBlank}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          <Plus size={15} />
          {lang === "th" ? "สร้างเอกสาร" : "New Document"}
        </button>
      </div>

      {creating && (
        <div style={{ marginBottom: 24 }}>
          <AILoadingDots label={lang === "th" ? "AI กำลังสร้างเอกสาร…" : "AI is creating your document…"} />
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 180, background: "var(--bg-card)", borderRadius: 16, animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <FileText size={48} color="var(--tx-faint)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--tx-muted)", marginBottom: 8 }}>{lang === "th" ? "ยังไม่มีเอกสาร" : "No documents yet"}</h3>
          <p style={{ color: "var(--tx-faint)", marginBottom: 24 }}>{lang === "th" ? "เริ่มสร้างเอกสารแรกด้วย AI" : "Create your first document with AI"}</p>
          <button onClick={createBlank} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            + {lang === "th" ? "สร้างเอกสาร" : "New Document"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {docs.map(doc => <DocumentCard key={doc.id} doc={doc} onDelete={deleteDoc} />)}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

export default function DocumentsPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--tx-dim)" }}>Loading…</div>}>
      <DocumentsPage />
    </Suspense>
  )
}
