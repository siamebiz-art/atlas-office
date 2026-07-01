"use client"

import { useEffect, useState, useCallback } from "react"
import { Upload, FolderOpen, Trash2, Download, FileSearch, FileText, Table2, Presentation, Image, File } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDate, formatFileSize } from "@/lib/utils"
import type { FileItem } from "@/types"

function FileIcon({ type }: { type: string }) {
  if (type.includes("pdf")) return <FileSearch size={16} color="#ef4444" />
  if (type.includes("word") || type.includes("document")) return <FileText size={16} color="#6366f1" />
  if (type.includes("sheet") || type.includes("excel")) return <Table2 size={16} color="#10b981" />
  if (type.includes("presentation") || type.includes("powerpoint")) return <Presentation size={16} color="#f59e0b" />
  if (type.includes("image")) return <Image size={16} color="#06b6d4" />
  return <File size={16} color="var(--tx-dim)" />
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("files").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/files/upload", { method: "POST", body: formData })
    const { fileItem } = await res.json()
    if (fileItem) setFiles(prev => [fileItem, ...prev])
    setUploading(false)
    e.target.value = ""
  }

  async function deleteFile(file: FileItem) {
    await supabase.storage.from("atlas-files").remove([file.storage_path])
    await supabase.from("files").delete().eq("id", file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--tx-main)" }}>AI Files</h2>
          <p style={{ color: "var(--tx-dim)", fontSize: 14 }}>ศูนย์รวมไฟล์ทั้งหมด — อัปโหลด จัดการ ค้นหา</p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <Upload size={15} />
          {uploading ? "กำลังอัปโหลด…" : "อัปโหลดไฟล์"}
          <input type="file" onChange={handleUpload} style={{ display: "none" }} />
        </label>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาไฟล์…"
        style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "10px 16px", color: "var(--tx-main)", fontSize: 14, outline: "none", marginBottom: 20, boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
        onBlur={e => e.target.style.borderColor = "var(--bg-border)"}
      />

      {loading ? (
        <div style={{ color: "var(--tx-dim)", textAlign: "center", padding: 40 }}>กำลังโหลด…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <FolderOpen size={48} color="var(--tx-faint)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--tx-muted)", marginBottom: 8 }}>{search ? "ไม่พบไฟล์" : "ยังไม่มีไฟล์"}</h3>
          {!search && <p style={{ color: "var(--tx-faint)" }}>อัปโหลดไฟล์แรกของคุณ</p>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
          {filtered.map(file => (
            <div
              key={file.id}
              style={{ background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 14, padding: 16, transition: ".2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(139,92,246,0.1)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.boxShadow = "none" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-icon)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileIcon type={file.file_type} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--tx-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: "var(--tx-faint)", marginTop: 2 }}>{formatFileSize(file.file_size)}</div>
                </div>
              </div>
              {file.ai_summary && (
                <p style={{ fontSize: 11, color: "var(--tx-dim)", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{file.ai_summary}</p>
              )}
              <div style={{ fontSize: 11, color: "var(--tx-faint)", marginBottom: 10 }}>{formatDate(file.created_at)}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <a href={file.public_url} download={file.name} target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 7, color: "#a78bfa", fontSize: 11, textDecoration: "none" }}>
                  <Download size={11} />ดาวน์โหลด
                </a>
                <button onClick={() => deleteFile(file)} style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(239,68,68,0.08)", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
