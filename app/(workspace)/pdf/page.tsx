"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Upload, FileSearch, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDate, formatFileSize } from "@/lib/utils"
import type { FileItem } from "@/types"

export default function PDFPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadFiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("files").select("*")
      .eq("user_id", user.id).eq("file_type", "application/pdf")
      .order("created_at", { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadFiles() }, [loadFiles])

  // Auto-upload from AICreateDialog "Upload & Learn"
  useEffect(() => {
    const data = sessionStorage.getItem("pendingUploadData")
    const name = sessionStorage.getItem("pendingUploadName")
    if (!data || !name) return
    sessionStorage.removeItem("pendingUploadData")
    sessionStorage.removeItem("pendingUploadName")
    sessionStorage.removeItem("pendingUploadType")

    // Convert base64 back to File
    fetch(data).then(r => r.blob()).then(blob => {
      const file = new File([blob], name, { type: "application/pdf" })
      uploadFile(file)
    })
  }, [])

  async function uploadFile(file: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/files/upload", { method: "POST", body: formData })
    const { fileItem } = await res.json()
    if (fileItem) setFiles(prev => [fileItem, ...prev])
    setUploading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.type !== "application/pdf") return
    await uploadFile(file)
    e.target.value = ""
  }

  async function deleteFile(id: string, storagePath: string) {
    await supabase.storage.from("atlas-files").remove([storagePath])
    await supabase.from("files").delete().eq("id", id)
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--tx-main)" }}>AI PDF</h2>
          <p style={{ color: "var(--tx-dim)", fontSize: 14 }}>อัปโหลด PDF แล้วสนทนา สรุป และค้นหาด้วย AI</p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <Upload size={15} />
          {uploading ? "กำลังอัปโหลด…" : "อัปโหลด PDF"}
          <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} />
        </label>
      </div>

      {loading ? (
        <div style={{ color: "var(--tx-dim)", padding: 40, textAlign: "center" }}>กำลังโหลด…</div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <FileSearch size={48} color="var(--tx-faint)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--tx-muted)", marginBottom: 8 }}>ยังไม่มี PDF</h3>
          <p style={{ color: "var(--tx-faint)" }}>อัปโหลด PDF เพื่อเริ่มสนทนากับ AI</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {files.map(file => (
            <div
              key={file.id}
              style={{ background: "var(--bg-main)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 16, padding: 20 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(239,68,68,0.08)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)"; e.currentTarget.style.boxShadow = "none" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileSearch size={16} color="#ef4444" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--tx-faint)", marginTop: 2 }}>{formatFileSize(file.file_size)} · {formatDate(file.created_at)}</div>
                </div>
              </div>
              {file.ai_summary && (
                <p style={{ fontSize: 12, color: "var(--tx-dim)", lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{file.ai_summary}</p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/pdf/${file.id}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  <Eye size={12} />
                  เปิดอ่าน
                </Link>
                <button onClick={() => deleteFile(file.id, file.storage_path)} style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
