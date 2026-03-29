/**
 * Base formatting utilities for consistent UI presentation.
 */

/**
 * Formats a numeric amount as a EUR currency string.
 * Optionally adds a '+' or '-' sign based on transaction type.
 */
export const formatCurrency = (amount: number, type?: "depense" | "revenu") => {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount)

  if (!type) return formatted
  
  const isIncome = type === "revenu"
  return isIncome ? `+${formatted}` : `-${formatted}`
}

/**
 * Formats a date string into a readable representation.
 * Returns 'Aujourd'hui' or 'Hier' or formatted date.
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return "Hier"
  
  return new Intl.DateTimeFormat("fr-FR", { 
    day: "numeric", 
    month: "short" 
  }).format(date)
}

/**
 * Formats a date string into a 24h time string.
 */
export const formatTime = (dateString: string) => 
  new Intl.DateTimeFormat("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  }).format(new Date(dateString))
