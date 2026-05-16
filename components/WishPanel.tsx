"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { STAR_SHAPES } from "./StarShapes"

type Props = {
  onLaunch: (starShape: string, wishText: string) => void
}

export default function WishPanel({ onLaunch }: Props) {
  const [selectedShape, setSelectedShape] = useState<string | null>(null)
  const [wishText, setWishText] = useState("")
  const [step, setStep] = useState<"choose" | "write">("choose")

  function handleShapeSelect(id: string) {
    setSelectedShape(id)
    setStep("write")
  }

  function handleLaunch() {
    if (!selectedShape || !wishText.trim()) return
    onLaunch(selectedShape, wishText)
    setSelectedShape(null)
    setWishText("")
    setStep("choose")
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute left-0 top-0 h-full w-72 z-30 flex flex-col justify-center px-6 py-10"
      style={{
        background: "linear-gradient(135deg, rgba(13,27,62,0.85) 0%, rgba(6,11,24,0.9) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] text-white/30 mb-1" style={{ fontFamily: "var(--font-jost)" }}>
          STAR WISH
        </p>
        <h1 className="text-3xl text-white/90 leading-tight" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
          Send a wish<br/>to the universe
        </h1>
        <div className="mt-3 w-8 h-px bg-gradient-to-r from-yellow-300/50 to-transparent"/>
      </div>

      {/* Step 1 — Choose star */}
      <div className="mb-6">
        <p className="text-xs tracking-[0.2em] text-white/40 mb-4" style={{ fontFamily: "var(--font-jost)" }}>
          01 — CHOOSE YOUR STAR
        </p>
        <div className="grid grid-cols-5 gap-2">
          {STAR_SHAPES.map(({ id, label, Component }) => (
            <motion.button
              key={id}
              onClick={() => handleShapeSelect(id)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
              style={{
                background: selectedShape === id
                  ? "rgba(244, 201, 122, 0.15)"
                  : "rgba(255,255,255,0.03)",
                border: selectedShape === id
                  ? "1px solid rgba(244, 201, 122, 0.5)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Component
                color={selectedShape === id ? "#F4C97A" : "#ffffff50"}
                size={28}
              />
              <span
                className="text-[9px] tracking-wider"
                style={{
                  fontFamily: "var(--font-jost)",
                  color: selectedShape === id ? "#F4C97A" : "rgba(255,255,255,0.3)",
                }}
              >
                {label.toUpperCase()}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Step 2 — Write wish */}
      <AnimatePresence>
        {step === "write" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs tracking-[0.2em] text-white/40 mb-3" style={{ fontFamily: "var(--font-jost)" }}>
              02 — MAKE YOUR WISH
            </p>
            <textarea
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="I wish for..."
              rows={4}
              className="w-full resize-none rounded-2xl p-4 text-white/80 placeholder-white/20 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "var(--font-cormorant)",
                fontSize: "16px",
                fontWeight: 300,
                lineHeight: "1.6",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(244,201,122,0.3)"
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255,255,255,0.08)"
              }}
            />

            <motion.button
              onClick={handleLaunch}
              disabled={!wishText.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full py-3 rounded-2xl text-sm tracking-[0.2em] transition-all disabled:opacity-30"
              style={{
                fontFamily: "var(--font-jost)",
                background: wishText.trim()
                  ? "linear-gradient(135deg, rgba(244,201,122,0.2), rgba(232,165,152,0.2))"
                  : "rgba(255,255,255,0.04)",
                border: wishText.trim()
                  ? "1px solid rgba(244,201,122,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                color: wishText.trim() ? "#F4C97A" : "rgba(255,255,255,0.3)",
              }}
            >
              READY TO LAUNCH ✦
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-6 left-6">
        <p className="text-[10px] text-white/15 tracking-widest" style={{ fontFamily: "var(--font-jost)" }}>
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
        </p>
      </div>
    </motion.div>
  )
}