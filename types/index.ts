export type Plan = "free" | "pro" | "team"

export interface Profile {
  id: string
  email: string
  full_name: string
  plan: Plan
  company_name: string | null
  company_logo_url: string | null
  brand_colors: Record<string, string>
  default_language: "th" | "en" | "zh" | "ja"
  created_at: string
}

export type DocType =
  | "report" | "proposal" | "quotation" | "invoice"
  | "contract" | "meeting-notes" | "sop" | "resume"
  | "cover-letter" | "business-plan" | "marketing-plan" | "general"

export interface Document {
  id: string
  user_id: string
  title: string
  content: string
  doc_type: DocType
  language: string
  tags: string[]
  word_count: number
  created_at: string
  updated_at: string
}

export interface SheetData {
  headers: string[]
  rows: string[][]
  formulas?: Record<string, string>
}

export interface Sheet {
  id: string
  user_id: string
  title: string
  data: SheetData
  sheet_type: string
  created_at: string
  updated_at: string
}

export interface SlideItem {
  id: string
  title: string
  layout: "cover" | "content" | "two-column" | "image" | "blank" | "closing"
  content: {
    headline?: string
    subtitle?: string
    body?: string
    bullets?: string[]
    leftContent?: string
    rightContent?: string
  }
  backgroundColor?: string
  speakerNotes?: string
  imageKeyword?: string   // Unsplash search keyword
  imageSeed?: number      // increment to get new random image for same keyword
}

export interface Presentation {
  id: string
  user_id: string
  title: string
  slides: SlideItem[]
  theme: "dark" | "light" | "indigo" | "corporate"
  created_at: string
  updated_at: string
}

export interface FileItem {
  id: string
  user_id: string
  name: string
  file_size: number
  file_type: string
  storage_path: string
  public_url: string
  ai_summary: string | null
  tags: string[]
  created_at: string
}

export interface KnowledgeItem {
  id: string
  user_id: string
  key: string
  value: string
  item_type: "text" | "image" | "template"
  created_at: string
}

export interface AutomationStep {
  id: string
  type: "generate-doc" | "generate-sheet" | "generate-slides" | "export-pdf" | "export-docx" | "save-file" | "send-email"
  config: Record<string, string>
  label: string
}

export interface Automation {
  id: string
  user_id: string
  name: string
  steps: AutomationStep[]
  trigger_type: "manual" | "scheduled" | "webhook"
  is_active: boolean
  last_run_at: string | null
  created_at: string
}

export interface WorkspaceIntent {
  module: "documents" | "sheets" | "slides" | "pdf" | "files" | "search" | "knowledge" | "automation"
  docType?: DocType
  prompt: string
  language: "th" | "en"
}
