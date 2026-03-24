"use client"

import { cn } from "@/lib/utils"

interface Category {
  name: string
  amount: number
  color: string
  percentage: number
}

interface CategoryChartProps {
  categories: Category[]
  title: string
}

export function CategoryChart({ categories, title }: CategoryChartProps) {
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate segments for the donut chart
  let cumulativePercentage = 0
  const segments = categories.map((cat) => {
    const segment = {
      ...cat,
      offset: cumulativePercentage,
    }
    cumulativePercentage += cat.percentage
    return segment
  })

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30">
      <h3 className="text-lg font-semibold text-foreground mb-6">{title}</h3>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Donut Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {segments.map((segment, index) => {
              const radius = 40
              const circumference = 2 * Math.PI * radius
              const strokeDasharray = (segment.percentage / 100) * circumference
              const strokeDashoffset = -(segment.offset / 100) * circumference

              return (
                <circle
                  key={segment.name}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="12"
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 8px ${segment.color}40)`,
                  }}
                />
              )
            })}
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-secondary/50"
            />
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Legend & Progress Bars */}
        <div className="flex-1 w-full space-y-4">
          {categories.map((category) => (
            <div key={category.name} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full transition-transform duration-200 group-hover:scale-125"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {category.percentage}%
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
                  style={{
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                    boxShadow: `0 0 12px ${category.color}60`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
