"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createAmbientAudio } from "@/lib/ambient-audio"
import { readAmbientEnabled, writeAmbientEnabled } from "@/lib/ambient-preference"

type Star = {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

const STAR_CROSS_SHADOW =
  "0 0 2px 1px rgba(255,255,255,0.22), 0 0 6px 2px rgba(200,210,255,0.12)"
const STAR_CORE_SHADOW = "0 0 4px 1.5px rgba(255,255,255,0.35)"

export default function LandingPage() {
  const router = useRouter()
  const [stars, setStars] = useState<Star[]>([])
  const [leaving, setLeaving] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const s = Array.from({ length: 96 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 3,
      duration: 2.4 + Math.random() * 4.2,
      delay: Math.random() * 5,
    }))
    setStars(s)

    const audio = createAmbientAudio()
    audioRef.current = audio

    if (readAmbientEnabled()) {
      audio.muted = false
      void audio.play().then(() => {
        setSoundOn(true)
        writeAmbientEnabled(true)
      }).catch(() => {
        audio.muted = true
        setSoundOn(false)
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

  const toggleSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const a = audioRef.current
    if (!a) return
    if (soundOn) {
      a.pause()
      a.muted = true
      setSoundOn(false)
      writeAmbientEnabled(false)
    } else {
      a.muted = false
      void a
        .play()
        .then(() => {
          setSoundOn(true)
          writeAmbientEnabled(true)
        })
        .catch(() => {
          setSoundOn(false)
          writeAmbientEnabled(false)
        })
    }
  }, [soundOn])

  function playTapSound() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  }

  function handleTap() {
    if (leaving) return
    writeAmbientEnabled(soundOn)
    playTapSound()
    setLeaving(true)
    setTimeout(() => router.push("/sky"), 800)
  }

  return (
    <div
      onClick={handleTap}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "radial-gradient(ellipse 120% 80% at 50% 20%, #0a0614 0%, #000 55%, #020208 100%)",
        cursor: "crosshair",
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.8s ease",
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* STARS — dim layer so CTA stays readable */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        {stars.map(star => (
          <div
            key={star.id}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: "1px",
              height: "1px",
              animation: `twinkle-cross ${star.duration}s ease-in-out infinite`,
              animationDelay: `${star.delay}s`,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: `${star.size}px`,
                height: "1px",
                background: "rgba(255,255,255,0.55)",
                top: "0px", left: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: STAR_CROSS_SHADOW,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "1px",
                height: `${star.size}px`,
                background: "rgba(255,255,255,0.55)",
                top: "0px", left: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: STAR_CROSS_SHADOW,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "2px", height: "2px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.75)",
                top: "0px", left: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: STAR_CORE_SHADOW,
              }}
            />
          </div>
        ))}
      </div>

      {/* Soft vignette + center stage for typography */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
          background: [
            "radial-gradient(ellipse 72% 56% at 50% 50%, rgba(6,3,14,0.78) 0%, rgba(0,0,0,0.2) 62%, transparent 74%)",
            "radial-gradient(circle at 50% 120%, rgba(40,20,70,0.25), transparent 45%)",
          ].join(", "),
        }}
      />

      {/* OUTER FRAME */}
      <div style={{
        position: "absolute",
        top: "16px", left: "16px", right: "16px", bottom: "16px",
        border: "1px solid rgba(255,255,255,0.22)",
        pointerEvents: "none",
        zIndex: 5,
      }} />

      {/* TITLE BAR */}
      <div style={{
        position: "absolute",
        top: "16px", left: "16px", right: "16px",
        height: "44px",
        background: "linear-gradient(180deg, rgba(28,24,36,0.92) 0%, rgba(12,10,18,0.88) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 6,
        pointerEvents: "none",
      }}>
        <div style={{ width: "14px", height: "14px", background: "rgba(255,255,255,0.12)", borderRadius: "2px" }} />
        <span style={{
          fontFamily: "'Courier New', monospace",
          color: "rgba(230,220,255,0.88)",
          fontSize: "14px",
          fontWeight: "bold",
          letterSpacing: "0.22em",
        }}>
          Make a wish
        </span>
        <div style={{ width: "14px", height: "14px", background: "rgba(255,255,255,0.12)", borderRadius: "2px" }} />
      </div>

      {/* Sound — does not trigger “start”; unlocks ambience early if you prefer */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggleSound}
        style={{
          position: "absolute",
          top: "72px",
          right: "24px",
          zIndex: 12,
          cursor: "pointer",
          fontFamily: "'Courier New', monospace",
          fontSize: "11px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: soundOn ? "rgba(200,255,220,0.85)" : "rgba(255,200,255,0.75)",
          background: "rgba(12,8,22,0.65)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "999px",
          padding: "8px 14px",
          backdropFilter: "blur(10px)",
        }}
      >
        {soundOn ? "♪ On" : "♪ Off"}
      </button>

      {/* CENTER TEXT */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        textAlign: "center",
        maxWidth: "min(92vw, 520px)",
        padding: "28px 36px",
        borderRadius: "20px",
        background: "rgba(4,2,10,0.35)",
        border: "1px solid rgba(200,160,255,0.12)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.4) inset, 0 24px 48px rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
      }}>
        <p
          className={leaving ? "landing-cta-text landing-cta-text--leaving" : "landing-cta-text"}
          style={{
            fontFamily: "'Courier New', monospace",
            color: leaving ? "rgba(255,255,255,0.92)" : "#e8c4ff",
            fontSize: "clamp(13px, 2.8vw, 17px)",
            fontWeight: "bold",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            lineHeight: 1.55,
            transition: "color 0.6s ease",
          }}
        >
          {leaving ? "✦ entering the sky ✦" : "Tap anywhere to start"}
        </p>
        {!leaving && (
          <p style={{
            marginTop: "14px",
            fontFamily: "'Courier New', monospace",
            fontSize: "10px",
            letterSpacing: "0.2em",
            color: "rgba(200,180,230,0.42)",
            textTransform: "uppercase",
          }}>
            Tap ♪ above to toggle sound
          </p>
        )}
      </div>

      {/* CORNER MARKS */}
      <div style={{ position: "absolute", top: "8px", left: "8px", width: "8px", height: "8px", border: "1px solid rgba(255,255,255,0.28)", zIndex: 7, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "8px", right: "8px", width: "8px", height: "8px", border: "1px solid rgba(255,255,255,0.28)", zIndex: 7, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "8px", left: "8px", width: "8px", height: "8px", border: "1px solid rgba(255,255,255,0.28)", zIndex: 7, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "8px", height: "8px", border: "1px solid rgba(255,255,255,0.28)", zIndex: 7, pointerEvents: "none" }} />
    </div>
  )
}
