export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
  })
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function truncate(str: string, max = 60) {
  return str.length > max ? str.slice(0, max) + "…" : str
}

export function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0]) as T
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as T
  } catch {
    return fallback
  }
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
