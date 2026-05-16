"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star } from "@/types/wish"

type Props = {
  star: Star | null
  onClose: () => void
  onSubmit: (starId: string, content: string) => Promise<void>
}

export default function WishModal({ star, onClose, onSubmit }: Props) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reflection, setReflection] = useState("")

  async function handleSubmit() {
    if (!content.trim() || !star) return
    setLoading(true)
    await onSubmit(star.id, content)
    setSubmitted(true)
    setLoading(false)
  }

  function handleClose() {
    setContent("")
    setSubmitted(false)
    setReflection("")
    onClose()
  }

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal box */}
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1026]/95 p-6 text-white"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                <p className="mb-1 text-xs uppercase tracking-widest text-white/40">
                  ✦ you found a star
                </p>
                <h2 className="mb-4 text-lg font-semibold">Make a wish</h2>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="I wish for..."
                  rows={4}
                  className="w-full resize-none rounded-xl bg-white/5 p-3 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-white/30 transition"
                />

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-white/50 hover:bg-white/5 transition"
                  >
                    cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || loading}
                    className="flex-1 rounded-xl bg-white/10 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-40 transition"
                  >
                    {loading ? "sending..." : "✨ send wish"}
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mb-3 text-4xl">🌟</div>
                <h2 className="mb-2 text-lg font-semibold">Wish sent into the universe</h2>
                <p className="mb-4 text-sm text-white/50">
                  "{content}"
                </p>
                <button
                  onClick={handleClose}
                  className="rounded-xl border border-white/10 px-6 py-2 text-sm text-white/60 hover:bg-white/5 transition"
                >
                  close
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}