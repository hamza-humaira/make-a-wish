"use client"

import { useState, useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { STAR_SHAPES } from "./StarShapes"

type Props = {
  starShape: string
  wishText: string
  onComplete: () => void
}

export default function LaunchSequence({ starShape, wishText, onComplete }: Props) {
  const shape = STAR_SHAPES.find(s => s.id === starShape)
  const Component = shape?.Component
  const [launched, setLaunched] = useState(false)
  const [dragging, setDragging] = useState(false)
  const y = useMotionValue(0)
  const trail = useTransform(y, [-200, 0], [120, 0])
  const starOpacity = useTransform(y, [-300, -100, 0], [0, 1, 1])
  const glowIntensity = useTransform(y, [-200, 0], [1.8, 1])

  function handleDragEnd(_: any, info: any) {
    if (info.offset.y < -120) {
      // Launch!
      setLaunched(true)
      animate(y, -window.innerHeight, {
        duration: 1.2,
        ease: [0.2, 0, 0.4, 1],
        onComplete: () => {
          setTimeout(onComplete, 300)
        }
      })
    } else {
      // Snap back
      animate(y, 0, { duration: 0.5, ease: "easeOut" })
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "radial-gradient(ellipse at center, rgba(13,27,62,0.95) 0%, rgba(6,11,24,0.98) 100%)" }}
    >
      {/* Stars in background - faint */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 70}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      {/* Wish text shown at top */}
      <motion.div
        className="absolute top-16 text-center px-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-white/30 text-xs tracking-[0.3em] mb-3" style={{ fontFamily: "var(--font-jost)" }}>
          YOUR WISH
        </p>
        <p
          className="text-white/70 text-2xl max-w-sm leading-relaxed"
          style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
        >
          "{wishText}"
        </p>
      </motion.div>

      {/* Instruction */}
      <motion.p
        className="absolute text-white/25 text-xs tracking-[0.25em] mb-8"
        style={{
          fontFamily: "var(--font-jost)",
          bottom: launched ? -50 : "calc(50% - 140px)",
          opacity: dragging || launched ? 0 : 1,
          transition: "opacity 0.3s",
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        ↑ DRAG UP TO LAUNCH
      </motion.p>

      {/* Launchpad rings */}
      {!launched && (
        <div className="absolute bottom-28 flex items-center justify-center">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute rounded-full border border-yellow-300/10"
              style={{
                width: `${i * 60}px`,
                height: `${i * 60}px`,
                animation: `ripple ${i * 0.8 + 1}s ease-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* The draggable star */}
      <motion.div
        drag={!launched ? "y" : false}
        dragConstraints={{ top: -600, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ y, opacity: starOpacity, scale: glowIntensity, cursor: launched ? "default" : "grab" }}
        className="relative flex flex-col items-center"
      >
        {/* Trail below star */}
        <motion.div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 rounded-full"
          style={{
            height: trail,
            background: "linear-gradient(to bottom, rgba(244,201,122,0.8), transparent)",
          }}
        />

        {/* Star glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(244,201,122,0.3) 0%, transparent 70%)",
            width: "100px",
            height: "100px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        />

        {/* The star itself */}
        <motion.div
          animate={!launched ? { y: [0, -8, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          {Component && <Component color="#F4C97A" size={64} glow />}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}