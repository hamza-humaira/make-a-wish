"use client"

import { motion } from "framer-motion"
import type { Star as StarType } from "@/types/wish"
import { STAR_SHAPES, ClassicStar } from "./StarShapes"

type Props = {
  star: StarType & { shape?: string }
  onClick?: (star: StarType) => void
}

export default function Star({ star, onClick }: Props) {
  const isWished = !!star.wish
  const ShapeComponent = STAR_SHAPES.find(s => s.id === (star as any).shape)?.Component

  if (isWished && ShapeComponent) {
    // Wished star — show chosen shape with beautiful glow
    return (
      <motion.div
        className="absolute flex items-center justify-center"
        style={{
          left: `${star.x}%`,
          top: `${star.y}%`,
          transform: "translate(-50%, -50%)",
          cursor: "default",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {/* Outer glow ring — rotates slowly */}
        <motion.div
          className="absolute rounded-full border"
          style={{
            width: "40px",
            height: "40px",
            borderColor: "rgba(244,201,122,0.2)",
            borderStyle: "dashed",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        />

        {/* Pulsing glow behind star */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "30px",
            height: "30px",
            background: "radial-gradient(circle, rgba(244,201,122,0.6) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />

        {/* The star shape */}
        <ShapeComponent color="#F4C97A" size={20} glow />
      </motion.div>
    )
  }

  // Regular unwished star — simple dot
  return (
    <motion.div
      onClick={() => onClick?.(star)}
      className="absolute rounded-full bg-white cursor-pointer"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: `${star.size}px`,
        height: `${star.size}px`,
        transform: "translate(-50%, -50%)",
      }}
      animate={{
        opacity: [star.opacity * 0.4, star.opacity, star.opacity * 0.4],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 2 + Math.random() * 4,
        repeat: Infinity,
        delay: Math.random() * 4,
        ease: "easeInOut",
      }}
      whileHover={{
        scale: 3,
        backgroundColor: "#F4C97A",
        boxShadow: "0 0 12px rgba(244,201,122,0.8)",
        transition: { duration: 0.2 },
      }}
    />
  )
}