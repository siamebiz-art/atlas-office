"use client"

import { useEffect } from "react"

export default function ServiceWorkerReg() {
  useEffect(() => {
    // ห้าม register ใน dev mode — จะทำให้ page กระตุก
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(reg => console.log("[SW] registered", reg.scope))
      .catch(err => console.warn("[SW] registration failed", err))
  }, [])

  return null
}
