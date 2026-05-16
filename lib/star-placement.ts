import type { Wish } from "@/types/wish"

/** Pick a sky position (percent) that does not sit on top of existing wishes. */
export function pickWishStarPosition(existing: Pick<Wish, "star_x" | "star_y">[]): { star_x: number; star_y: number } {
  const minDist = 9
  for (let attempt = 0; attempt < 80; attempt++) {
    const star_x = 12 + Math.random() * 76
    const star_y = 14 + Math.random() * 72
    const ok = !existing.some((e) => Math.hypot(e.star_x - star_x, e.star_y - star_y) < minDist)
    if (ok) return { star_x, star_y }
  }
  return { star_x: 50 + (Math.random() - 0.5) * 20, star_y: 45 + (Math.random() - 0.5) * 20 }
}
