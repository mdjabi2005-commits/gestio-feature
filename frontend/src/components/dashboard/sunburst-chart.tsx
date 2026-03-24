import { useState, useMemo } from "react"
import { ArrowLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/icons"
import { getCategoryMetadata } from "@/lib/categories"

interface CategoryData {
  nom: string
  valeur: number
  couleur: string
  icone: string
  enfants?: CategoryData[]
}

interface SunburstChartProps {
  data: CategoryData[]
  title?: string
}

export function SunburstChart({ data, title = "Répartition des dépenses" }: SunburstChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [drillDownCategory, setDrillDownCategory] = useState<string | null>(null)

  // Helper to lighten/darken hex colors
  const shadeColor = (hex: string, percent: number) => {
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

  // Current level data
  const levelData = useMemo(() => {
    if (!drillDownCategory) return data
    const parent = data.find(c => c.nom === drillDownCategory)
    const children = parent?.enfants || []
    // Sort children by value descending for the gradient logic
    return [...children].sort((a, b) => b.valeur - a.valeur)
  }, [data, drillDownCategory])

  const processedData = useMemo(() => {
    const parentMeta = drillDownCategory ? getCategoryMetadata(data, drillDownCategory) : null
    
    return levelData.map((item, index) => {
      if (!drillDownCategory) {
        const meta = getCategoryMetadata(data, item.nom)
        return {
          ...item,
          couleur: meta.couleur,
          icone: meta.icone
        }
      } else {
        // Drill-down mode: apply gradient based on importance
        // First (largest) is darker (-25%), last items are lighter (+15% per step)
        const shadePercent = -25 + (index * 15) // Gradient effect: Max = Darkest, Min = Lightest
        return {
          ...item,
          couleur: shadeColor(parentMeta!.couleur, shadePercent),
          icone: parentMeta!.icone
        }
      }
    })
  }, [levelData, data, drillDownCategory])

  const total = useMemo(() => processedData.reduce((sum, item) => sum + item.valeur, 0), [processedData])

  // Helper to describe an SVG arc
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, innerRadius: number = 0) => {
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

  const segments = useMemo(() => {
    let currentAngle = 0
    return processedData.map((item) => {
      const angle = (item.valeur / (total || 1)) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      // Calculate label position
      const labelAngle = (startAngle + endAngle) / 2
      const labelRad = ((labelAngle - 90) * Math.PI) / 180
      const labelRadius = 88 // Centered in the segment (r=60 to r=115)
      const labelX = 120 + labelRadius * Math.cos(labelRad)
      const labelY = 120 + labelRadius * Math.sin(labelRad)

      return {
        ...item,
        startAngle,
        endAngle,
        labelX,
        labelY,
        labelAngle,
        pourcentage: (item.valeur / (total || 1)) * 100
      }
    })
  }, [processedData, total])

  const activeData = segments.find(s => s.nom === hoveredSegment)

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30 h-full flex flex-col min-h-0 overflow-hidden relative">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {drillDownCategory && (
          <button 
            onClick={() => setDrillDownCategory(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-indigo-400 hover:bg-secondary text-xs transition-all animate-in slide-in-from-right-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Retour
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        {/* SVG Container - Huge on wide screens */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[550px] lg:h-[550px] group animate-in zoom-in-95 duration-700">
          <svg viewBox="0 0 260 260" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.6)]">
            <g transform="translate(10, 10)">
              {/* Center hole background */}
              <circle cx="120" cy="120" r="50" className="fill-secondary/30 backdrop-blur-md" />

              {segments.map((segment) => (
                <g key={segment.nom} className="animate-in fade-in zoom-in-95 duration-500">
                  <path
                    d={describeArc(120, 120, 115, segment.startAngle, segment.endAngle, 60)}
                    fill={segment.couleur}
                    className={cn(
                      "cursor-pointer transition-all duration-500",
                      hoveredSegment === segment.nom
                        ? "opacity-100 filter brightness-110 scale-[1.03] transform origin-[120px_120px]"
                        : (hoveredSegment) ? "opacity-30 shadow-none" : "opacity-90 hover:opacity-100"
                    )}
                    onMouseEnter={() => setHoveredSegment(segment.nom)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => !drillDownCategory && segment.enfants ? setDrillDownCategory(segment.nom) : null}
                  />
                  
                  {/* Category Labels on Slices */}
                  {(segment.endAngle - segment.startAngle > 20) && (
                    <g className="pointer-events-none overflow-visible">
                      <text
                        x={segment.labelX}
                        y={segment.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-bold text-[7px] drop-shadow-md pointer-events-none select-none"
                        style={{ 
                          opacity: hoveredSegment && hoveredSegment !== segment.nom ? 0.3 : 1,
                          transition: 'opacity 0.3s ease'
                        }}
                      >
                        {segment.nom}
                      </text>
                      <text
                        x={segment.labelX}
                        y={segment.labelY + 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white/80 font-medium text-[5px] drop-shadow-sm pointer-events-none select-none"
                        style={{ 
                          opacity: hoveredSegment && hoveredSegment !== segment.nom ? 0.3 : 1,
                          transition: 'opacity 0.3s ease'
                        }}
                      >
                        {segment.valeur.toLocaleString("fr-FR")}€
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </g>
          </svg>

          {/* Central Information */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-background/60 backdrop-blur-xl rounded-full w-24 h-24 sm:w-40 sm:h-40 flex flex-col items-center justify-center border border-white/10 shadow-2xl transition-all duration-500">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mb-1 px-4 truncate max-w-full">
                {drillDownCategory ? drillDownCategory : (hoveredSegment ? 'Focus' : 'Total')}
              </span>
              <p className="text-sm sm:text-3xl font-black text-foreground tracking-tighter">
                {hoveredSegment ? (activeData?.pourcentage.toFixed(0) + '%') : (total.toLocaleString("fr-FR") + '€')}
              </p>
              {hoveredSegment && (
                <span className="text-[9px] sm:text-xs text-indigo-400 font-bold px-2 mt-1 truncate max-w-full">
                  {hoveredSegment}
                </span>
              )}
              {drillDownCategory && !hoveredSegment && (
                <span className="text-[10px] text-indigo-400 mt-1 uppercase tracking-[0.2em] font-black animate-pulse">Détails</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
