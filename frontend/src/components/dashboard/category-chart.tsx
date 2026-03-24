import { getCategoryIcon } from "@/lib/icons"
import { getCategoryMetadata } from "@/lib/categories"

interface Category {
  nom: string
  montant: number
  couleur: string
  pourcentage: number
  icone: string
}

interface CategoryChartProps {
  categories: Category[]
  title: string
}

export function CategoryChart({ categories, title }: CategoryChartProps) {
  // Use metadata for consistent styling
  const styledCategories = categories.map(cat => {
    const meta = getCategoryMetadata(categories, cat.nom)
    return {
      ...cat,
      couleur: meta.couleur,
      icone: meta.icone
    }
  })

  const total = styledCategories.reduce((sum, cat) => sum + cat.montant, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate segments for the donut chart
  let cumulativePercentage = 0
  const segments = styledCategories.map((cat) => {
    const segment = {
      ...cat,
      offset: cumulativePercentage,
    }
    cumulativePercentage += cat.pourcentage
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
              const strokeDasharray = (segment.pourcentage / 100) * circumference
              const strokeDashoffset = -(segment.offset / 100) * circumference

              return (
                <circle
                  key={`${segment.nom}-${index}`}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.couleur}
                  strokeWidth="12"
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 8px ${segment.couleur}40)`,
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
          {styledCategories.map((category, index) => {
            const Icon = getCategoryIcon(category.icone)
            return (
              <div key={`${category.nom}-${index}`} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: `${category.couleur}20`, color: category.couleur }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {category.nom}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {category.pourcentage}%
                  </span>
                </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${category.pourcentage}%`,
                    backgroundColor: category.couleur,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 px-5">
                {formatCurrency(category.montant)}
              </p>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
