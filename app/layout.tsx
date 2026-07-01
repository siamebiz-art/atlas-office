import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ServiceWorkerReg from "@/components/ServiceWorkerReg";

export const metadata: Metadata = {
  title: {
    default: "ATLAS Office™ — AI Productivity OS",
    template: "%s | ATLAS Office™",
  },
  description: "AI Productivity Operating System — สร้างเอกสาร ตาราง สไลด์ และจัดการไฟล์ด้วย AI",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('atlas-theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ATLAS Office" />
        <link rel="apple-touch-icon" href="/iconLogoOffice.png" />
        {/* TH Sarabun New (Thai official government font) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Kanit:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider><LanguageProvider>{children}</LanguageProvider></ThemeProvider>
        <ServiceWorkerReg />
      </body>
    </html>
  );
}
