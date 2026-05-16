type ShapeProps = {
  color?: string
  size?: number
  glow?: boolean
}

// 1. Classic 5-point star
export function ClassicStar({ color = "#F4C97A", size = 40, glow = false }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {glow && (
        <filter id="glow1">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      )}
      <polygon
        points="20,2 24.5,15 38,15 27,23 31,37 20,29 9,37 13,23 2,15 15.5,15"
        fill={color}
        filter={glow ? "url(#glow1)" : undefined}
      />
    </svg>
  )
}

// 2. Sparkle burst star
export function SparkleStar({ color = "#F4C97A", size = 40, glow = false }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <line x1="20" y1="2" x2="20" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="2" y1="20" x2="38" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="7" y1="7" x2="33" y2="33" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="33" y1="7" x2="7" y2="33" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="3" fill={color}/>
    </svg>
  )
}

// 3. Glowing orb star
export function OrbStar({ color = "#F4C97A", size = 40, glow = false }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="16" fill={color} fillOpacity="0.15"/>
      <circle cx="20" cy="20" r="10" fill={color} fillOpacity="0.4"/>
      <circle cx="20" cy="20" r="5" fill={color}/>
    </svg>
  )
}

// 4. Diamond 4-point star
export function DiamondStar({ color = "#F4C97A", size = 40, glow = false }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <polygon
        points="20,1 26,20 20,39 14,20"
        fill={color}
      />
      <polygon
        points="1,20 20,26 39,20 20,14"
        fill={color}
        fillOpacity="0.7"
      />
    </svg>
  )
}

// 5. Snowflake/flower star
export function FlowerStar({ color = "#F4C97A", size = 40, glow = false }: ShapeProps) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {petals.map((angle, i) => (
        <ellipse
          key={i}
          cx="20"
          cy="20"
          rx="2.5"
          ry="10"
          fill={color}
          fillOpacity={i % 2 === 0 ? "1" : "0.5"}
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3" fill={color}/>
    </svg>
  )
}

export const STAR_SHAPES = [
  { id: "classic", label: "Classic", Component: ClassicStar },
  { id: "sparkle", label: "Sparkle", Component: SparkleStar },
  { id: "orb",     label: "Orb",     Component: OrbStar },
  { id: "diamond", label: "Diamond", Component: DiamondStar },
  { id: "flower",  label: "Flower",  Component: FlowerStar },
]