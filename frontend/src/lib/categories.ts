import { getCategoryIcon } from "./icons"

export interface CategoryMetadata {
  nom: string
  couleur: string
  icone: string
}

// Frontend Source of Truth for Category Styles
// Basé sur le YAML de référence et les données réelles constatées
const CATEGORY_STYLES: Record<string, { couleur: string; icone: string }> = {
  "Alimentation": { couleur: "#f59e0b", icone: "utensils" },
  "Voiture": { couleur: "#3b82f6", icone: "car" },
  "Uber": { couleur: "#3b82f6", icone: "map-pin" },
  "Logement": { couleur: "#ec4899", icone: "home" },
  "Loisirs": { couleur: "#14b8a6", icone: "gamepad" },
  "Santé": { couleur: "#ef4444", icone: "heart" },
  "Shopping": { couleur: "#6366f1", icone: "shopping-bag" },
  "Services": { couleur: "#8b5cf6", icone: "briefcase" },
  "Travail Animateur": { couleur: "#8b5cf6", icone: "briefcase" },
  "Bourse": { couleur: "#10b981", icone: "trending-up" },
  "Investissement": { couleur: "#10b981", icone: "trending-up" },
  "Salaire": { couleur: "#6366f1", icone: "briefcase" },
  "Autre": { couleur: "#6b7280", icone: "shopping-cart" },
  "Divers": { couleur: "#6b7280", icone: "help-circle" }
}

export const getCategoryMetadata = (categories: any[], categoryName: string): CategoryMetadata => {
  // 1. Priorité aux styles statiques du Frontend (Design System)
  const style = CATEGORY_STYLES[categoryName]
  if (style) {
    return {
      nom: categoryName,
      ...style
    }
  }

  // 2. Recherche par correspondance partielle ou alias manuel si nécessaire
  // (On peut ajouter ici des normalisations si besoin)

  // 3. Fallback sur les données API si le backend fournit des couleurs
  const cat = categories.find(c => c.nom === categoryName)
  if (cat && cat.couleur) {
    return {
      nom: cat.nom,
      couleur: cat.couleur,
      icone: cat.icone || "help-circle"
    }
  }
  
  // 4. Fallback absolu (Gris ardoise)
  return {
    nom: categoryName,
    couleur: "#94a3b8",
    icone: "help-circle"
  }
}
