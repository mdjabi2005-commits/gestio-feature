"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface CategoryData {
  name: string
  value: number
  color: string
  children?: CategoryData[]
}

interface SunburstChartProps {
  data: CategoryData[]
  title?: string
}

export function SunburstChart({ data, title = "Répartition des dépenses" }: SunburstChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  // Calculate angles for each segment
  const segments = useMemo(() => {
    let currentAngle = -90 // Start from top
    return data.map((item) => {
      const angle = (item.value / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      // Calculate path for arc
      const innerRadius = 60
      const outerRadius = 100
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1Inner = 120 + innerRadius * Math.cos(startRad)
      const y1Inner = 120 + innerRadius * Math.sin(startRad)
      const x1Outer = 120 + outerRadius * Math.cos(startRad)
      const y1Outer = 120 + outerRadius * Math.sin(startRad)
      const x2Inner = 120 + innerRadius * Math.cos(endRad)
      const y2Inner = 120 + innerRadius * Math.sin(endRad)
      const x2Outer = 120 + outerRadius * Math.cos(endRad)
      const y2Outer = 120 + outerRadius * Math.sin(endRad)

      const largeArc = angle > 180 ? 1 : 0

      const path = `
        M ${x1Inner} ${y1Inner}
        L ${x1Outer} ${y1Outer}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
        L ${x2Inner} ${y2Inner}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}
        Z
      `

      // Calculate subcategory arcs if exists
      let subSegments: Array<{
        name: string
        color: string
        value: number
        percentage: number
        path: string
      }> = []
      if (item.children && item.children.length > 0) {
        const subTotal = item.children.reduce((sum, child) => sum + child.value, 0)
        let subCurrentAngle = startAngle
        const subInnerRadius = 105
        const subOuterRadius = 130

        subSegments = item.children.map((child) => {
          const subAngle = (child.value / subTotal) * angle
          const subStartAngle = subCurrentAngle
          const subEndAngle = subCurrentAngle + subAngle
          subCurrentAngle = subEndAngle

          const subStartRad = (subStartAngle * Math.PI) / 180
          const subEndRad = (subEndAngle * Math.PI) / 180

          const sx1Inner = 120 + subInnerRadius * Math.cos(subStartRad)
          const sy1Inner = 120 + subInnerRadius * Math.sin(subStartRad)
          const sx1Outer = 120 + subOuterRadius * Math.cos(subStartRad)
          const sy1Outer = 120 + subOuterRadius * Math.sin(subStartRad)
          const sx2Inner = 120 + subInnerRadius * Math.cos(subEndRad)
          const sy2Inner = 120 + subInnerRadius * Math.sin(subEndRad)
          const sx2Outer = 120 + subOuterRadius * Math.cos(subEndRad)
          const sy2Outer = 120 + subOuterRadius * Math.sin(subEndRad)

          const subLargeArc = subAngle > 180 ? 1 : 0

          return {
            name: child.name,
            color: child.color,
            value: child.value,
            percentage: (child.value / total) * 100,
            path: `
              M ${sx1Inner} ${sy1Inner}
              L ${sx1Outer} ${sy1Outer}
              A ${subOuterRadius} ${subOuterRadius} 0 ${subLargeArc} 1 ${sx2Outer} ${sy2Outer}
              L ${sx2Inner} ${sy2Inner}
              A ${subInnerRadius} ${subInnerRadius} 0 ${subLargeArc} 0 ${sx1Inner} ${sy1Inner}
              Z
            `,
          }
        })
      }

      return {
        ...item,
        percentage: (item.value / total) * 100,
        path,
        subSegments,
      }
    })
  }, [data, total])

  const displayData = hoveredSegment
    ? segments.find((s) => s.name === hoveredSegment)
    : selectedCategory
    ? segments.find((s) => s.name === selectedCategory)
    : null

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30 h-full">
      <h3 className="text-lg font-semibold text-foreground mb-6">{title}</h3>

      <div className="flex flex-col items-center">
        {/* SVG Sunburst */}
        <div className="relative">
          <svg viewBox="0 0 240 240" className="w-56 h-56">
            {/* Background circle */}
            <circle
              cx="120"
              cy="120"
              r="55"
              fill="transparent"
              className="stroke-secondary"
              strokeWidth="2"
            />

            {/* Main segments */}
            {segments.map((segment) => (
              <g key={segment.name}>
                <path
                  d={segment.path}
                  fill={segment.color}
                  className={cn(
                    "transition-all duration-300 cursor-pointer",
                    hoveredSegment === segment.name || selectedCategory === segment.name
                      ? "opacity-100 filter drop-shadow-lg"
                      : hoveredSegment || selectedCategory
                      ? "opacity-40"
                      : "opacity-80 hover:opacity-100"
                  )}
                  onMouseEnter={() => setHoveredSegment(segment.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === segment.name ? null : segment.name
                    )
                  }
                />

                {/* Sub-segments */}
                {(hoveredSegment === segment.name || selectedCategory === segment.name) &&
                  segment.subSegments.map((sub) => (
                    <path
                      key={sub.name}
                      d={sub.path}
                      fill={sub.color}
                      className="opacity-90 transition-all duration-300"
                    />
                  ))}
              </g>
            ))}

            {/* Center text */}
            <text
              x="120"
              y="115"
              textAnchor="middle"
              className="fill-foreground text-2xl font-bold"
            >
              {displayData
                ? `${displayData.percentage.toFixed(0)}%`
                : `${total.toLocaleString("fr-FR")}€`}
            </text>
            <text
              x="120"
              y="135"
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {displayData ? displayData.name : "Total"}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 mt-6 w-full">
          {segments.map((segment) => (
            <button
              key={segment.name}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200",
                selectedCategory === segment.name
                  ? "bg-secondary/70 ring-1 ring-indigo-500/50"
                  : "hover:bg-secondary/40"
              )}
              onMouseEnter={() => setHoveredSegment(segment.name)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === segment.name ? null : segment.name
                )
              }
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {segment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {segment.value.toLocaleString("fr-FR")}€
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
