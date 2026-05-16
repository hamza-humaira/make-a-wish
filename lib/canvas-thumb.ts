/** Alpha bounds of drawn pixels (ignores fully transparent canvas areas). */
export function getCanvasAlphaBounds(canvas: HTMLCanvasElement, alphaThreshold = 14) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  const w = canvas.width
  const h = canvas.height
  if (!w || !h) return null
  const data = ctx.getImageData(0, 0, w, h).data
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3]
      if (a > alphaThreshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (minX > maxX || minY > maxY) return null
  return { minX, minY, maxX, maxY, w, h }
}

function canvasToPngFullScaled(canvas: HTMLCanvasElement, maxSide: number): string {
  const w = canvas.width
  const h = canvas.height
  if (!w || !h) return ""
  const scale = Math.min(1, maxSide / Math.max(w, h))
  const ow = Math.max(1, Math.floor(w * scale))
  const oh = Math.max(1, Math.floor(h * scale))
  const oc = document.createElement("canvas")
  oc.width = ow
  oc.height = oh
  const c = oc.getContext("2d")
  if (!c) return ""
  c.clearRect(0, 0, ow, oh)
  c.drawImage(canvas, 0, 0, w, h, 0, 0, ow, oh)
  return oc.toDataURL("image/png")
}

/** Cropped PNG data URL with transparency — for preview + storage (no black JPEG matte). */
export function canvasToPngThumbCropped(
  canvas: HTMLCanvasElement,
  maxSide = 260,
  padding = 14,
): string {
  const b = getCanvasAlphaBounds(canvas)
  if (!b) return canvasToPngFullScaled(canvas, maxSide)
  const sx = Math.max(0, b.minX - padding)
  const sy = Math.max(0, b.minY - padding)
  const ex = Math.min(b.w, b.maxX + 1 + padding)
  const ey = Math.min(b.h, b.maxY + 1 + padding)
  const cw = Math.max(1, ex - sx)
  const ch = Math.max(1, ey - sy)
  const scale = Math.min(1, maxSide / Math.max(cw, ch))
  const ow = Math.max(1, Math.floor(cw * scale))
  const oh = Math.max(1, Math.floor(ch * scale))
  const oc = document.createElement("canvas")
  oc.width = ow
  oc.height = oh
  const c = oc.getContext("2d")
  if (!c) return ""
  c.clearRect(0, 0, ow, oh)
  c.drawImage(canvas, sx, sy, cw, ch, 0, 0, ow, oh)
  return oc.toDataURL("image/png")
}

/** Resize drawing to a smaller JPEG data URL (opaque). Prefer `canvasToPngThumbCropped` for stars. */
export function canvasToJpegThumb(canvas: HTMLCanvasElement, maxSide = 220, quality = 0.82): string {
  const w = canvas.width
  const h = canvas.height
  if (!w || !h) return ""
  const scale = Math.min(1, maxSide / Math.max(w, h))
  const ow = Math.max(1, Math.floor(w * scale))
  const oh = Math.max(1, Math.floor(h * scale))
  const oc = document.createElement("canvas")
  oc.width = ow
  oc.height = oh
  const c = oc.getContext("2d")
  if (!c) return ""
  c.drawImage(canvas, 0, 0, w, h, 0, 0, ow, oh)
  return oc.toDataURL("image/jpeg", quality)
}
