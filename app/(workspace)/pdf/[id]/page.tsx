"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import PDFViewer from "@/components/pdf/PDFViewer"
import PDFChatPanel from "@/components/pdf/PDFChatPanel"
import type { FileItem } from "@/types"

export default function PDFDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [file, setFile] = useState<FileItem | null>(null)

  useEffect(() => {
    supabase.from("files").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setFile(data)
    })
  }, [id])

  if (!file) return <div style={{ padding: 40, color: "var(--tx-dim)" }}>กำลังโหลด…</div>

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", margin: -24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-deep, var(--bg-main))", flexShrink: 0 }}>
        <button onClick={() => router.push("/pdf")} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-card-hover)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={14} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-primary)", flex: 1 }}>{file.name}</span>
      </div>

      {/* Split view */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", overflow: "hidden" }}>
        <PDFViewer url={file.public_url} name={file.name} />
        <PDFChatPanel fileId={file.id} fileName={file.name} />
      </div>
    </div>
  )
}
