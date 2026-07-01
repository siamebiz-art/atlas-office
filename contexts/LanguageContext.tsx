"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Lang = "th" | "en"
const LanguageContext = createContext<{ lang: Lang; toggle: () => void }>({ lang: "th", toggle: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("th")

  useEffect(() => {
    const saved = localStorage.getItem("atlas-lang") as Lang | null
    if (saved === "th" || saved === "en") setLang(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem("atlas-lang", lang)
    document.documentElement.setAttribute("lang", lang)
  }, [lang])

  const toggle = () => setLang(l => l === "th" ? "en" : "th")

  return <LanguageContext.Provider value={{ lang, toggle }}>{children}</LanguageContext.Provider>
}

export const useLang = () => useContext(LanguageContext)
