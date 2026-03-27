/**
 * Lighten or darken a hex color by a percentage.
 */
export const shadeColor = (hex: string, percent: number) => {
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)

  r = Math.floor(r * (100 + percent) / 100)
  g = Math.floor(g * (100 + percent) / 100)
  b = Math.floor(b * (100 + percent) / 100)

  r = Math.min(255, Math.max(0, r))
  g = Math.min(255, Math.max(0, g))
  b = Math.min(255, Math.max(0, b))

  const rr = r.toString(16).padStart(2, '0')
  const gg = g.toString(16).padStart(2, '0')
  const bb = b.toString(16).padStart(2, '0')

  return `#${rr}${gg}${bb}`
}

/**
 * Generates an SVG path data string for an arc segment.
 */
export const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, innerRadius: number = 0) => {
  const startRad = ((startAngle - 90) * Math.PI) / 180
  const endRad = ((endAngle - 90) * Math.PI) / 180

  const x1 = x + radius * Math.cos(startRad)
  const y1 = y + radius * Math.sin(startRad)
  const x2 = x + radius * Math.cos(endRad)
  const y2 = y + radius * Math.sin(endRad)

  const x3 = x + innerRadius * Math.cos(endRad)
  const y3 = y + innerRadius * Math.sin(endRad)
  const x4 = x + innerRadius * Math.cos(startRad)
  const y4 = y + innerRadius * Math.sin(startRad)

  const largeArc = endAngle - startAngle <= 180 ? 0 : 1

  return `
    M ${x1} ${y1}
    A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
    Z
  `
}
