"use client"

import { motion, useMotionValue, animate, useTransform } from "framer-motion"
import { useState, useEffect, type CSSProperties } from "react"
import { createPortal } from "react-dom"

type Props = {
  thumbUrl: string
  onLaunched: () => void
}

/** Small tail under the star */
function StarTail() {
  return (
    <svg
      aria-hidden
      className="mt-1 shrink-0"
      width={18}
      height={36}
      viewBox="0 0 18 36"
    >
      <line x1="9" y1="0" x2="9" y2="22" stroke="rgba(220,200,250,0.42)" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M5 24 Q9 31 13 24"
        stroke="rgba(190,170,230,0.35)"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LaunchLayer({ thumbUrl, onLaunched }: Props) {
  const pullY = useMotionValue(0)
  const [flying, setFlying] = useState(false)
  const scale = useTransform(pullY, [0, 140], [1, 1.02])

  /** True viewport center – grid on full screen (portal to body) */
  const layerBase: CSSProperties = {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    boxSizing: "border-box",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    justifyContent: "center",
  }

  if (flying) {
    const tx = typeof window !== "undefined" ? window.innerWidth * 0.38 : 480
    const ty = typeof window !== "undefined" ? -window.innerHeight * 0.46 : -440

    return (
      <div style={{ ...layerBase, zIndex: 9998, overflow: "visible", pointerEvents: "none", background: "transparent" }}>
        <motion.div
          className="relative flex flex-col items-center"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: -5 }}
          animate={{
            x: tx,
            y: ty,
            opacity: 0,
            scale: 0.18,
            rotate: 18,
          }}
          transition={{ duration: 0.9, ease: [0.18, 0.82, 0.12, 1] }}
          onAnimationComplete={() => onLaunched()}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              left: "50%",
              top: "50%",
              width: "min(52vw, 240px)",
              height: "6px",
              transform: "translate(calc(-100% + 38px), -50%) rotate(-8deg)",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 18%, rgba(220,200,255,0.35) 55%, rgba(255,255,255,0.75) 100%)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl}
            alt=""
            className="relative z-[2] block w-[min(34vw,168px)] h-auto max-h-[30vh] object-contain"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.45))" }}
            draggable={false}
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div
      style={{
        ...layerBase,
        zIndex: 9998,
        overflow: "visible",
        pointerEvents: "auto",
        paddingLeft: "16px",
        paddingRight: "16px",
        background: "linear-gradient(180deg, rgba(6,4,12,0.08) 0%, rgba(4,2,10,0.14) 100%)",
      }}
    >
      <div className="flex w-full max-w-[min(92vw,380px)] flex-col items-center justify-center">
        <motion.div
          style={{ y: pullY, scale }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 200 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.y > 72) setFlying(true)
            else void animate(pullY, 0, { duration: 0.38, ease: "easeOut" })
          }}
          className="flex cursor-grab touch-none select-none flex-col items-center active:cursor-grabbing"
        >
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl}
              alt=""
              className="block w-[min(34vw,168px)] h-auto max-h-[30vh] object-contain"
              style={{ filter: "drop-shadow(0 0 8px rgba(232,196,255,0.28))" }}
              draggable={false}
            />
            <StarTail />
          </div>
        </motion.div>

        <p
          className="mt-6 w-full px-2 text-center"
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "clamp(10px, 2.8vw, 12px)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(218,200,242,0.92)",
            lineHeight: 1.65,
          }}
        >
          Drag down and release to launch your wish to the sky
        </p>
      </div>
    </div>
  )
}

export function WishLaunchDock(props: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(<LaunchLayer {...props} />, document.body)
}
