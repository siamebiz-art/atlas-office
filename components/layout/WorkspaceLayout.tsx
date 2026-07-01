"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { supabase } from "@/lib/supabase"

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/sign-in")
      else setChecked(true)
    })
  }, [router])

  if (!checked) return null

  return (
    <div style={{ display: "flex", background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ width: 260, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className="mobile-sidebar-wrapper"
        style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: sidebarOpen ? "auto" : "none" }}
      >
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", opacity: sidebarOpen ? 1 : 0, transition: ".25s" }}
        />
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: 260,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s ease",
        }}>
          <Sidebar />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "20px 32px" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
