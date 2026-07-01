"use client"

import type { SlideItem } from "@/types"

const themes: Record<string, { bg: string; accent: string; text: string; sub: string }> = {
  dark:      { bg: "#0f0f1a", accent: "#6366f1", text: "#ffffff", sub: "#94a3b8" },
  light:     { bg: "#ffffff", accent: "#6366f1", text: "#111827", sub: "#6b7280" },
  indigo:    { bg: "#1e1b4b", accent: "#a5b4fc", text: "#ffffff", sub: "#c7d2fe" },
  corporate: { bg: "#0f172a", accent: "#38bdf8", text: "#ffffff", sub: "#94a3b8" },
}

function unsplashUrl(keyword: string, seed: number, w = 800, h = 600) {
  const sig = seed > 0 ? seed : 1
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(keyword)}&sig=${sig}`
}

export default function SlideCanvas({
  slide,
  theme = "dark",
  scale = 1,
}: {
  slide: SlideItem
  theme?: string
  scale?: number
}) {
  const t = themes[theme] ?? themes.dark
  const c = slide.content
  const imgUrl = slide.imageKeyword
    ? unsplashUrl(slide.imageKeyword, slide.imageSeed ?? 1)
    : null

  // ── Outer wrapper — always 16:9
  const outer: React.CSSProperties = {
    background: t.bg, borderRadius: 12, overflow: "hidden",
    position: "relative",
    aspectRatio: "16/9",
    width: `${100 / scale}%`,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    display: "flex",
    flexShrink: 0,
    fontFamily: "'Sarabun', 'TH Sarabun PSK', 'TH Sarabun New', sans-serif",
  }

  return (
    <div style={outer}>

      {/* ══ COVER + CLOSING: image as background ══ */}
      {(slide.layout === "cover" || slide.layout === "closing") && (
        <>
          {imgUrl && (
            <>
              <img
                src={imgUrl} alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* dark overlay so text stays readable */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
            </>
          )}
          {/* Accent bar */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: t.accent, zIndex: 2 }} />
          {/* Text */}
          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10% 12%", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "clamp(18px,3.5vw,42px)", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: "0.4em", textShadow: imgUrl ? "0 2px 12px rgba(0,0,0,0.5)" : "none" }}>
                {c.headline ?? slide.title}
              </div>
              {c.subtitle && (
                <div style={{ fontSize: "clamp(11px,1.7vw,20px)", color: imgUrl ? "rgba(255,255,255,0.85)" : t.sub, textShadow: imgUrl ? "0 1px 8px rgba(0,0,0,0.5)" : "none" }}>
                  {c.subtitle}
                </div>
              )}
            </div>
          </div>
          {/* Slide number */}
          <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: "rgba(255,255,255,0.3)", zIndex: 2 }}>{slide.id}</div>
        </>
      )}

      {/* ══ CONTENT: text left + image right ══ */}
      {slide.layout === "content" && (
        <>
          {/* Accent bar */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: t.accent, zIndex: 2 }} />

          {imgUrl ? (
            // Split layout: text (58%) | image (42%)
            <div style={{ flex: 1, display: "flex" }}>
              <div style={{ flex: "0 0 58%", padding: "7% 5% 7% 10%", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ fontSize: "clamp(12px,2vw,26px)", fontWeight: 800, color: t.accent, marginBottom: "0.5em", lineHeight: 1.2 }}>
                  {slide.title}
                </div>
                {c.bullets && c.bullets.length > 0 && (
                  <ul style={{ paddingLeft: "1.1em", margin: 0 }}>
                    {c.bullets.map((b, i) => (
                      <li key={i} style={{ fontSize: "clamp(9px,1.15vw,14px)", color: t.text, marginBottom: "0.35em", lineHeight: 1.55 }}>{b}</li>
                    ))}
                  </ul>
                )}
                {c.body && !c.bullets?.length && (
                  <div style={{ fontSize: "clamp(9px,1.2vw,14px)", color: t.sub, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{c.body}</div>
                )}
              </div>
              {/* Image panel */}
              <div style={{ flex: "0 0 42%", position: "relative", overflow: "hidden" }}>
                <img src={imgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                {/* Blend edge left */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 48, background: `linear-gradient(to right, ${t.bg}, transparent)`, zIndex: 1 }} />
              </div>
            </div>
          ) : (
            // No image — original full-width layout
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "7% 8% 7% 12%" }}>
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: "clamp(14px,2.2vw,28px)", fontWeight: 700, color: t.accent, marginBottom: "0.6em" }}>{slide.title}</div>
                {c.body && (
                  <div style={{ fontSize: "clamp(10px,1.4vw,16px)", color: t.sub, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.body}</div>
                )}
                {c.bullets && (
                  <ul style={{ paddingLeft: "1.2em", margin: 0 }}>
                    {c.bullets.map((b, i) => (
                      <li key={i} style={{ fontSize: "clamp(10px,1.4vw,15px)", color: t.text, marginBottom: "0.4em", lineHeight: 1.5 }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Slide number */}
          <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: `${t.text}44`, zIndex: 2 }}>{slide.id}</div>
        </>
      )}

      {/* ══ TWO-COLUMN ══ */}
      {slide.layout === "two-column" && (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: t.accent, zIndex: 2 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "7% 8% 7% 12%", overflow: "hidden" }}>
            <div style={{ fontSize: "clamp(14px,2vw,24px)", fontWeight: 700, color: t.accent, marginBottom: "0.8em" }}>{slide.title}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1em", flex: 1 }}>
              <div style={{ fontSize: "clamp(9px,1.2vw,13px)", color: t.sub, lineHeight: 1.6 }}>{c.leftContent}</div>
              {imgUrl ? (
                <div style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                  <img src={imgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ fontSize: "clamp(9px,1.2vw,13px)", color: t.sub, lineHeight: 1.6 }}>{c.rightContent}</div>
              )}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: `${t.text}44` }}>{slide.id}</div>
        </>
      )}

      {/* ══ IMAGE (full-image layout) ══ */}
      {slide.layout === "image" && (
        <>
          {imgUrl ? (
            <>
              <img src={imgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)" }} />
            </>
          ) : (
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${t.accent}22, ${t.bg})` }} />
          )}
          <div style={{ position: "absolute", bottom: "12%", left: "8%", right: "8%", zIndex: 1 }}>
            <div style={{ fontSize: "clamp(14px,2.5vw,30px)", fontWeight: 800, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>{c.headline ?? slide.title}</div>
            {c.subtitle && <div style={{ fontSize: "clamp(10px,1.5vw,17px)", color: "rgba(255,255,255,0.8)", marginTop: "0.3em" }}>{c.subtitle}</div>}
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: t.accent, zIndex: 2 }} />
          <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: "rgba(255,255,255,0.35)", zIndex: 2 }}>{slide.id}</div>
        </>
      )}

      {/* ══ BLANK ══ */}
      {slide.layout === "blank" && (
        <>
          {imgUrl && (
            <>
              <img src={imgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
            </>
          )}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: t.accent, zIndex: 2 }} />
          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10%" }}>
            <div style={{ fontSize: "clamp(20px,4vw,48px)", fontWeight: 800, color: imgUrl ? "#fff" : t.text, textAlign: "center", textShadow: imgUrl ? "0 2px 16px rgba(0,0,0,0.6)" : "none" }}>
              {c.headline ?? slide.title}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: imgUrl ? "rgba(255,255,255,0.35)" : `${t.text}44` }}>{slide.id}</div>
        </>
      )}
    </div>
  )
}
