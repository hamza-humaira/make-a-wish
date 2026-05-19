"use client"

import { useEffect, useState, useRef, useCallback, type CSSProperties, type PointerEvent, type MouseEvent } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Wish } from "@/types/wish"
import { getPublicWishes, saveWish, deleteWish, toggleLike } from "@/lib/wishes"
import { getOrCreateUserId } from "@/lib/user-id"
import { canvasToPngThumbCropped } from "@/lib/canvas-thumb"
import { pickWishStarPosition } from "@/lib/star-placement"
import { WishLaunchDock } from "@/components/sky/WishLaunchDock"
import { createAmbientAudio } from "@/lib/ambient-audio"
import { readAmbientEnabled, writeAmbientEnabled } from "@/lib/ambient-preference"

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace(/^#/, "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return `rgba(255,255,255,${alpha})`
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function dabBrushAlongLine(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, color: string) {
  ctx.save()
  ctx.globalCompositeOperation = "source-over"
  const dx = bx - ax
  const dy = by - ay
  const dist = Math.hypot(dx, dy)
  const steps = Math.max(1, Math.ceil(dist / 3.2))
  const radius = 7
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const x = ax + dx * t
    const y = ay + dy * t
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
    g.addColorStop(0, hexToRgba(color, 0.52))
    g.addColorStop(0.55, hexToRgba(color, 0.16))
    g.addColorStop(1, hexToRgba(color, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function dabEraserAlongLine(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) {
  ctx.save()
  ctx.globalCompositeOperation = "destination-out"
  const dx = bx - ax
  const dy = by - ay
  const dist = Math.hypot(dx, dy)
  const steps = Math.max(1, Math.ceil(dist / 5))
  const radius = 13
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const x = ax + dx * t
    const y = ay + dy * t
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
    g.addColorStop(0, "rgba(0,0,0,0.75)")
    g.addColorStop(0.65, "rgba(0,0,0,0.22)")
    g.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

type BgStar = { id: string; x: number; y: number; size: number; duration: number; delay: number }
type Tool = "brush" | "eraser"
type Stage = "draw" | "wish" | "launch" | "browse"

const STAR_CROSS_SHADOW = "0 0 2px 1px rgba(255,255,255,0.22), 0 0 6px 2px rgba(200,210,255,0.12)"
const STAR_CORE_SHADOW = "0 0 4px 1.5px rgba(255,255,255,0.35)"
const COLORS = ["#f5f0ff", "#e8c4ff", "#c9a0ff", "#7dd3fc", "#fde68a", "#fda4af"]

const shellBg: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "radial-gradient(ellipse 120% 80% at 50% 20%, #0a0614 0%, #000 55%, #020208 100%)",
}

function clearCanvasPixels(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

export default function SkyPageClient() {
  const [bgStars, setBgStars] = useState<BgStar[]>([])
  const [wishes, setWishes] = useState<Wish[]>([])
  const [tool, setTool] = useState<Tool>("brush")
  const [color, setColor] = useState(COLORS[0])
  const [stage, setStage] = useState<Stage>("draw")
  const [wishText, setWishText] = useState("")
  const [starThumb, setStarThumb] = useState<string | null>(null)
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null)
  const [saving, setSaving] = useState(false)
  const [wishDeleting, setWishDeleting] = useState(false)
  const [liking, setLiking] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const [myUserId, setMyUserId] = useState<string>("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<{ x: number; y: number } | null>(null)

  const loadWishes = useCallback(async (uid?: string) => {
    const list = await getPublicWishes(uid)
    setWishes(list)
  }, [])

  useEffect(() => {
    const uid = getOrCreateUserId()
    setMyUserId(uid)
    setBgStars(
      Array.from({ length: 88 }, () => ({
        id: uuidv4(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 5 + 3,
        duration: 2.4 + Math.random() * 4.2,
        delay: Math.random() * 5,
      })),
    )
    void loadWishes(uid)
  }, [loadWishes])

  useEffect(() => {
    const audio = createAmbientAudio(0.13)
    audioRef.current = audio
    if (readAmbientEnabled()) {
      audio.muted = false
      void audio.play().then(() => setMusicOn(true)).catch(() => {
        audio.muted = true
        setMusicOn(false)
        writeAmbientEnabled(false)
      })
    }
    const onVis = () => {
      if (document.visibilityState === "visible") void audio.play().catch(() => {})
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      document.removeEventListener("visibilitychange", onVis)
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
      audioRef.current = null
    }
  }, [])

  const toggleMusic = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const a = audioRef.current
    if (!a) return
    if (musicOn) {
      a.pause()
      a.muted = true
      setMusicOn(false)
      writeAmbientEnabled(false)
      return
    }
    a.muted = false
    void a.play().then(() => {
      setMusicOn(true)
      writeAmbientEnabled(true)
    }).catch(() => {
      a.muted = true
      setMusicOn(false)
      writeAmbientEnabled(false)
    })
  }, [musicOn])

  const getPos = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    }
  }, [])

  const drawSegment = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (tool === "eraser") dabEraserAlongLine(ctx, from.x, from.y, to.x, to.y)
    else dabBrushAlongLine(ctx, from.x, from.y, to.x, to.y, color)
  }, [tool, color])

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (stage !== "draw") return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = getPos(e)
    lastRef.current = p
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (ctx) {
      if (tool === "eraser") dabEraserAlongLine(ctx, p.x, p.y, p.x, p.y)
      else dabBrushAlongLine(ctx, p.x, p.y, p.x, p.y, color)
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (stage !== "draw" || !drawingRef.current || !lastRef.current) return
    const p = getPos(e)
    drawSegment(lastRef.current, p)
    lastRef.current = p
  }

  const endStroke = () => {
    drawingRef.current = false
    lastRef.current = null
  }

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const wrap = canvas.parentElement
    if (!wrap) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = wrap.clientWidth
    const cssH = wrap.clientHeight
    const nextW = Math.max(1, Math.floor(cssW * dpr))
    const nextH = Math.max(1, Math.floor(cssH * dpr))
    const prevW = canvas.width
    const prevH = canvas.height
    if (prevW === nextW && prevH === nextH) {
      const ctx0 = canvas.getContext("2d")
      if (ctx0) ctx0.setTransform(dpr, 0, 0, dpr, 0, 0)
      return
    }
    const snap = document.createElement("canvas")
    snap.width = prevW
    snap.height = prevH
    const sctx = snap.getContext("2d")
    if (sctx && prevW && prevH) sctx.drawImage(canvas, 0, 0)
    canvas.width = nextW
    canvas.height = nextH
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (prevW && prevH) {
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(snap, 0, 0, prevW, prevH, 0, 0, nextW, nextH)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  useEffect(() => {
    if (stage !== "draw") return
    resizeCanvas()
    const ro = new ResizeObserver(() => resizeCanvas())
    const wrap = canvasRef.current?.parentElement
    if (wrap) ro.observe(wrap)
    window.addEventListener("resize", resizeCanvas)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [resizeCanvas, stage])

  const goToWishFromDraw = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const png = canvasToPngThumbCropped(canvas)
      setStarThumb(png || canvas.toDataURL("image/png"))
    }
    setStage("wish")
  }

  const startNewWish = () => {
    setWishText("")
    setStarThumb(null)
    setStage("draw")
    requestAnimationFrame(() => {
      const c = canvasRef.current
      if (c) {
        clearCanvasPixels(c)
        resizeCanvas()
      }
    })
  }

  const handleLaunchComplete = async () => {
    const text = wishText.trim() || "✦"
    const thumb = starThumb
    setSaving(true)
    try {
      const pos = pickWishStarPosition(wishes)
      const saved = await saveWish(text, pos.star_x, pos.star_y, thumb || null, myUserId)
      if (saved) setWishes((prev) => [saved, ...prev.filter((w) => w.id !== saved.id)])
      else await loadWishes(myUserId)
    } finally {
      setSaving(false)
      setStage("browse")
      setStarThumb(null)
    }
  }

  const handleDeleteSelectedWish = async () => {
    if (!selectedWish || wishDeleting) return
    setWishDeleting(true)
    const ok = await deleteWish(selectedWish.id)
    setWishDeleting(false)
    if (ok) {
      setWishes((prev) => prev.filter((w) => w.id !== selectedWish.id))
      setSelectedWish(null)
    }
  }

  const handleToggleLike = async () => {
    if (!selectedWish || liking || !myUserId) return
    setLiking(true)
    const newCount = await toggleLike(selectedWish.id, myUserId, selectedWish.liked_by_me ?? false)
    const updated = {
      ...selectedWish,
      like_count: newCount,
      liked_by_me: !selectedWish.liked_by_me,
    }
    setSelectedWish(updated)
    setWishes((prev) => prev.map((w) => w.id === selectedWish.id ? updated : w))
    setLiking(false)
  }

  const sheetOpen = stage === "wish"

  return (
    <div style={{ ...shellBg, overflow: stage === "wish" || stage === "launch" ? "visible" : "hidden" }}>

      {/* Background twinkle stars */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        {bgStars.map((star) => (
          <div key={star.id} style={{ position: "absolute", left: `${star.x}%`, top: `${star.y}%`, width: "1px", height: "1px", animation: `twinkle-cross ${star.duration}s ease-in-out infinite`, animationDelay: `${star.delay}s` }}>
            <div style={{ position: "absolute", width: `${star.size}px`, height: "1px", background: "rgba(255,255,255,0.55)", top: 0, left: "50%", transform: "translate(-50%, -50%)", boxShadow: STAR_CROSS_SHADOW }} />
            <div style={{ position: "absolute", width: "1px", height: `${star.size}px`, background: "rgba(255,255,255,0.55)", top: 0, left: "50%", transform: "translate(-50%, -50%)", boxShadow: STAR_CROSS_SHADOW }} />
            <div style={{ position: "absolute", width: "2px", height: "2px", borderRadius: "50%", background: "rgba(255,255,255,0.75)", top: 0, left: "50%", transform: "translate(-50%, -50%)", boxShadow: STAR_CORE_SHADOW }} />
          </div>
        ))}
      </div>

      {/* Wishes in the sky */}
      {(stage === "browse" || stage === "draw") && wishes.length > 0 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 7, pointerEvents: stage === "browse" ? "auto" : "none" }}>
          {wishes.map((w) => (
            <button key={w.id} type="button" title="Read wish" onClick={() => setSelectedWish(w)}
              style={{ position: "absolute", left: `${w.star_x}%`, top: `${w.star_y}%`, transform: "translate(-50%, -50%)", width: "44px", height: "44px", border: "none", padding: 0, borderRadius: 0, cursor: stage === "browse" ? "pointer" : "default", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {w.drawing_data
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={w.drawing_data} alt="" className="wish-thumb-soft" style={{ width: "36px", height: "36px", objectFit: "contain", pointerEvents: "none" }} />
                : <span className="wish-dot-soft" style={{ width: "4px", height: "4px", pointerEvents: "none", display: "block" }} />
              }
            </button>
          ))}
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", background: ["radial-gradient(ellipse 85% 70% at 70% 35%, rgba(6,3,14,0.55) 0%, transparent 55%)", "radial-gradient(circle at 50% 120%, rgba(40,20,70,0.2), transparent 45%)"].join(", ") }} />
      <div style={{ position: "absolute", top: "16px", left: "16px", right: "16px", bottom: "16px", border: "1px solid rgba(255,255,255,0.22)", pointerEvents: "none", zIndex: 5 }} />
      <div style={{ position: "absolute", top: "16px", left: "16px", right: "16px", height: "44px", background: "linear-gradient(180deg, rgba(28,24,36,0.92) 0%, rgba(12,10,18,0.88) 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 6, pointerEvents: "none" }}>
        <div style={{ width: "14px", height: "14px", background: "rgba(255,255,255,0.12)", borderRadius: "2px" }} />
        <span style={{ fontFamily: "'Courier New', monospace", color: "rgba(230,220,255,0.88)", fontSize: "14px", fontWeight: "bold", letterSpacing: "0.22em" }}>Make a wish</span>
        <div style={{ width: "14px", height: "14px", background: "rgba(255,255,255,0.12)", borderRadius: "2px" }} />
      </div>

      <button type="button" onClick={toggleMusic} style={{ position: "absolute", top: "72px", right: "24px", zIndex: 10000, cursor: "pointer", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: musicOn ? "rgba(200,255,220,0.85)" : "rgba(255,200,255,0.75)", background: "rgba(12,8,22,0.55)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "999px", padding: "8px 14px", backdropFilter: "blur(10px)" }}>
        {musicOn ? "♪ On" : "♪ Off"}
      </button>

      {stage === "browse" && (
        <button type="button" onClick={startNewWish} style={{ position: "absolute", top: "118px", right: "24px", zIndex: 10000, fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(232,196,255,0.95)", background: "rgba(120,70,160,0.45)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: "999px", padding: "10px 18px", cursor: "pointer", backdropFilter: "blur(8px)" }}>
          New wish
        </button>
      )}

      {["tl", "tr", "bl", "br"].map((k) => (
        <div key={k} style={{ position: "absolute", ...(k === "tl" ? { top: 8, left: 8 } : {}), ...(k === "tr" ? { top: 8, right: 8 } : {}), ...(k === "bl" ? { bottom: 8, left: 8 } : {}), ...(k === "br" ? { bottom: 8, right: 8 } : {}), width: "8px", height: "8px", border: "1px solid rgba(255,255,255,0.28)", zIndex: 7, pointerEvents: "none" }} />
      ))}

      {/* Drawing workspace */}
      <div style={{ position: "absolute", top: "72px", left: "24px", right: "24px", bottom: "24px", zIndex: 8, display: stage === "draw" ? "flex" : "none", gap: "14px", minHeight: 0 }}>
        <aside style={{ flex: "0 0 auto", width: "56px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "12px 8px", borderRadius: "16px", background: "rgba(4,2,10,0.55)", border: "1px solid rgba(200,160,255,0.14)", boxShadow: "0 16px 40px rgba(0,0,0,0.35)", backdropFilter: "blur(10px)", alignSelf: "stretch" }}>
          <ToolBtn label="Brush" active={tool === "brush"} onClick={() => setTool("brush")} icon="✎" />
          <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
            {COLORS.map((c) => (
              <button key={c} type="button" title={c} onClick={() => { setColor(c); setTool("brush") }}
                style={{ width: "22px", height: "22px", borderRadius: "50%", background: c, border: color === c && tool !== "eraser" ? "2px solid rgba(255,255,255,0.85)" : "1px solid rgba(0,0,0,0.35)", cursor: "pointer", padding: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.12) inset" }} />
            ))}
          </div>
          <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.08)" }} />
          <ToolBtn label="Eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} icon="⌫" />
        </aside>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 120, borderRadius: "18px", overflow: "hidden", border: "1px solid rgba(200,160,255,0.22)", background: "transparent", boxShadow: "0 0 32px rgba(140,110,190,0.14), 0 0 60px rgba(80,60,120,0.08), inset 0 0 0 1px rgba(255,255,255,0.06)", position: "relative" }}>
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onPointerLeave={endStroke}
              style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair" }}
            />
          </div>

          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "14px 12px 4px" }}>
            <p style={{ fontFamily: "'Courier New', monospace", fontSize: "clamp(12px, 3.4vw, 15px)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", color: "rgba(228,210,252,0.95)", margin: 0, lineHeight: 1.45, width: "100%" }}>
              Draw your star to make a wish
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button type="button" onClick={() => setStage("browse")}
                style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "999px", padding: "10px 22px", cursor: "pointer" }}>
                Skip — just browse
              </button>
              <button type="button" onClick={goToWishFromDraw}
                style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(232,196,255,0.95)", background: "rgba(120,70,160,0.45)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: "999px", padding: "10px 26px", cursor: "pointer", backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {stage === "wish" && starThumb && (
        <div style={{ position: "fixed", left: "50%", top: "min(16vh, 132px)", zIndex: 22, transform: "translateX(-50%)", pointerEvents: "none", background: "transparent" }}>
          <div className="star-wish-float-inner" style={{ background: "transparent" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={starThumb} alt="" style={{ width: "min(38vw, 176px)", height: "auto", maxHeight: "26vh", objectFit: "contain", display: "block", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.35))" }} />
          </div>
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 14, pointerEvents: sheetOpen ? "auto" : "none", background: sheetOpen ? "rgba(0,0,0,0.06)" : "transparent", opacity: sheetOpen ? 1 : 0, transition: "opacity 0.35s ease" }} aria-hidden={!sheetOpen} />

      <div style={{ position: "absolute", left: "16px", right: "16px", bottom: "16px", zIndex: 20, maxHeight: sheetOpen ? "min(52vh, 440px)" : "0", opacity: sheetOpen ? 1 : 0, transform: sheetOpen ? "translateY(0)" : "translateY(110%)", transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease, max-height 0.42s ease", pointerEvents: sheetOpen ? "auto" : "none" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderRadius: "20px 20px 16px 16px", padding: "20px 20px 18px", background: "rgba(8,5,18,0.92)", border: "1px solid rgba(200,160,255,0.18)", boxShadow: "0 -12px 48px rgba(0,0,0,0.55)", backdropFilter: "blur(14px)" }}>
          <div style={{ width: "44px", height: "4px", borderRadius: "99px", background: "rgba(255,255,255,0.18)", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(200,180,230,0.65)", margin: "0 0 12px", textAlign: "center" }}>Write your wish</p>
          <textarea value={wishText} onChange={(e) => setWishText(e.target.value)} placeholder="Your words drift upward…" rows={5}
            style={{ width: "100%", resize: "vertical", minHeight: "120px", borderRadius: "14px", border: "1px solid rgba(200,160,255,0.2)", background: "rgba(3,2,10,0.65)", color: "rgba(245,235,255,0.92)", fontFamily: "'Courier New', monospace", fontSize: "13px", lineHeight: 1.5, padding: "14px 16px", outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
            <button type="button" onClick={() => setStage("launch")} style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(232,196,255,0.95)", background: "rgba(120,70,160,0.45)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: "999px", padding: "10px 22px", cursor: "pointer" }}>
              Done
            </button>
          </div>
        </div>
      </div>

      {stage === "launch" && starThumb && <WishLaunchDock thumbUrl={starThumb} onLaunched={handleLaunchComplete} />}

      {saving && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", pointerEvents: "none", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.2em", color: "rgba(230,220,255,0.75)" }}>
          Saving…
        </div>
      )}

      {selectedWish && (
        <div role="dialog" aria-modal style={{ position: "fixed", inset: 0, zIndex: 11000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setSelectedWish(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px", width: "100%", borderRadius: "18px", padding: "22px", background: "rgba(8,5,18,0.95)", border: "1px solid rgba(200,160,255,0.22)", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
            <p style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(200,180,230,0.55)", marginBottom: "12px" }}>A wish in the sky</p>
            {selectedWish.drawing_data && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedWish.drawing_data} alt="" style={{ width: "100%", maxHeight: "160px", objectFit: "contain", marginBottom: "14px", borderRadius: "12px" }} />
            )}
            <p style={{ fontFamily: "'Courier New', monospace", fontSize: "14px", lineHeight: 1.6, color: "rgba(235,225,255,0.92)", fontStyle: "italic" }}>"{selectedWish.content}"</p>
            <div style={{ marginTop: "18px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <button type="button" onClick={() => setSelectedWish(null)} style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(232,196,255,0.95)", background: "rgba(120,70,160,0.35)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "999px", padding: "8px 18px", cursor: "pointer" }}>
                Close
              </button>
              <button type="button" disabled={liking} onClick={() => void handleToggleLike()}
                style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Courier New', monospace", fontSize: "13px", color: selectedWish.liked_by_me ? "rgba(255,120,160,1)" : "rgba(255,255,255,0.4)", background: selectedWish.liked_by_me ? "rgba(255,80,120,0.15)" : "rgba(255,255,255,0.06)", border: selectedWish.liked_by_me ? "1px solid rgba(255,100,140,0.4)" : "1px solid rgba(255,255,255,0.12)", borderRadius: "999px", padding: "8px 16px", cursor: liking ? "wait" : "pointer", transition: "all 0.2s ease", opacity: liking ? 0.6 : 1 }}>
                <span style={{ fontSize: "16px", lineHeight: 1 }}>{selectedWish.liked_by_me ? "♥" : "♡"}</span>
                <span>{selectedWish.like_count ?? 0}</span>
              </button>
              {selectedWish.user_id && selectedWish.user_id === myUserId && (
                <button type="button" disabled={wishDeleting} onClick={() => void handleDeleteSelectedWish()}
                  style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,200,200,0.95)", background: "rgba(80,30,45,0.45)", border: "1px solid rgba(255,150,160,0.25)", borderRadius: "999px", padding: "8px 18px", cursor: wishDeleting ? "wait" : "pointer", opacity: wishDeleting ? 0.65 : 1 }}>
                  {wishDeleting ? "Removing…" : "Remove wish"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolBtn({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: string }) {
  return (
    <button type="button" title={label} onClick={onClick}
      style={{ width: "40px", height: "40px", borderRadius: "12px", border: active ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)", background: active ? "rgba(120,70,160,0.4)" : "rgba(255,255,255,0.06)", color: "rgba(232,220,255,0.92)", cursor: "pointer", fontSize: "16px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
      <span aria-hidden>{icon}</span>
    </button>
  )
}