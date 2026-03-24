"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface BalanceDataPoint {
  date: string
  balance: number
  income: number
  expense: number
}

interface BalanceChartProps {
  data: BalanceDataPoint[]
  title?: string
}

export function BalanceChart({ data, title = "Évolution du solde" }: BalanceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

  const filteredData = useMemo(() => {
    const now = new Date()
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return data.filter((d) => new Date(d.date) >= cutoff)
  }, [data, timeRange])

  const { minBalance, maxBalance, chartPoints, areaPath, linePath } = useMemo(() => {
    if (filteredData.length === 0) {
      return { minBalance: 0, maxBalance: 0, chartPoints: [], areaPath: "", linePath: "" }
    }

    const balances = filteredData.map((d) => d.balance)
    const min = Math.min(...balances)
    const max = Math.max(...balances)
    const padding = (max - min) * 0.1 || 100
    const minB = min - padding
    const maxB = max + padding

    const width = 500
    const height = 200
    const paddingX = 0
    const paddingY = 20

    const points = filteredData.map((d, i) => {
      const x = paddingX + (i / (filteredData.length - 1)) * (width - paddingX * 2)
      const y = paddingY + (1 - (d.balance - minB) / (maxB - minB)) * (height - paddingY * 2)
      return { x, y, data: d }
    })

    // Create smooth curve path
    const linePathStr = points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`
      const prev = points[i - 1]
      const cpx = (prev.x + point.x) / 2
      return `${path} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`
    }, "")

    // Area path (add bottom edge)
    const areaPathStr = `${linePathStr} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

    return {
      minBalance: minB,
      maxBalance: maxB,
      chartPoints: points,
      areaPath: areaPathStr,
      linePath: linePathStr,
    }
  }, [filteredData])

  const currentBalance = filteredData[filteredData.length - 1]?.balance || 0
  const startBalance = filteredData[0]?.balance || 0
  const change = currentBalance - startBalance
  const changePercent = startBalance > 0 ? ((change / startBalance) * 100).toFixed(1) : "0"
  const isPositive = change >= 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
    }).format(new Date(dateString))
  }

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(currentBalance)}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? "+" : ""}{changePercent}%
            </span>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
                timeRange === range
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex-1 min-h-[200px]">
        <svg
          viewBox="0 0 500 200"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient for area */}
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={20 + ratio * 160}
              x2="500"
              y2={20 + ratio * 160}
              className="stroke-border/30"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#balanceGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            className="stroke-indigo-500"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Hover point */}
          {hoveredPoint !== null && chartPoints[hoveredPoint] && (
            <>
              {/* Vertical line */}
              <line
                x1={chartPoints[hoveredPoint].x}
                y1="20"
                x2={chartPoints[hoveredPoint].x}
                y2="180"
                className="stroke-indigo-400/50"
                strokeDasharray="4 4"
              />
              {/* Point */}
              <circle
                cx={chartPoints[hoveredPoint].x}
                cy={chartPoints[hoveredPoint].y}
                r="6"
                className="fill-indigo-500 stroke-background"
                strokeWidth="2"
              />
            </>
          )}

          {/* Interactive overlay */}
          {chartPoints.map((point, i) => (
            <rect
              key={i}
              x={point.x - 15}
              y="0"
              width="30"
              height="200"
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && chartPoints[hoveredPoint] && (
          <div
            className="absolute z-10 px-3 py-2 rounded-lg bg-popover/95 backdrop-blur-sm border border-border shadow-xl pointer-events-none"
            style={{
              left: `${(chartPoints[hoveredPoint].x / 500) * 100}%`,
              top: `${(chartPoints[hoveredPoint].y / 200) * 100 - 15}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="text-xs text-muted-foreground mb-1">
              {formatDate(chartPoints[hoveredPoint].data.date)}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(chartPoints[hoveredPoint].data.balance)}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-emerald-400">
                +{formatCurrency(chartPoints[hoveredPoint].data.income)}
              </span>
              <span className="text-xs text-rose-400">
                -{formatCurrency(chartPoints[hoveredPoint].data.expense)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-1">
        {filteredData.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">
              {formatDate(filteredData[0].date)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(filteredData[filteredData.length - 1].date)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
