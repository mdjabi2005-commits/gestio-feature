import { getCategoryIcon } from "./icons"

export interface CategoryMetadata {
  nom: string
  couleur: string
  icone: string
}

// Frontend Source of Truth for Category Styles
// Basé sur le YAML de référence et les données réelles constatées
export const CATEGORY_STYLES: Record<string, { couleur: string; icone: string; subcategories: string[] }> = {
  "Alimentation": { 
    couleur: "#f59e0b", 
    icone: "utensils",
    subcategories: ['Supermarché', 'Boulangerie', 'Boucherie', 'Marché', 'Fast Food', 'Restaurant', 'Café / Bar', 'Épicerie']
  },
  "Voiture": { 
    couleur: "#3b82f6", 
    icone: "car",
    subcategories: ['Essence', 'Péage', 'Parking', 'Entretien', 'Réparation', 'Contrôle technique', 'Assurance auto', 'Lavage', 'Feu Vert abonnement']
  },
  "Uber": { 
    couleur: "#3b82f6", 
    icone: "truck",
    subcategories: ['Livraison']
  },
  "Logement": { 
    couleur: "#ec4899", 
    icone: "home",
    subcategories: ['Loyer', 'Électricité', 'Gaz', 'Eau', 'Internet / Téléphone', 'Assurance habitation', 'Travaux', 'Mobilier', 'Électroménager']
  },
  "Loisirs": { 
    couleur: "#14b8a6", 
    icone: "gamepad",
    subcategories: ['Cinéma', 'Sport', 'Jeux vidéo', 'Musique', 'Livres', 'Sorties', 'Voyages', 'Streaming']
  },
  "Santé": { 
    couleur: "#ef4444", 
    icone: "heart",
    subcategories: ['Pharmacie', 'Médecin', 'Dentiste', 'Optique', 'Mutuelle', 'Hôpital', 'Parapharmacie']
  },
  "Shopping": { 
    couleur: "#6366f1", 
    icone: "shopping-bag",
    subcategories: ['Vêtements', 'Chaussures', 'Électronique', 'Informatique', 'Beauté / Cosmétiques', 'Cadeaux', 'Maison / Déco']
  },
  "Services": { 
    couleur: "#8b5cf6", 
    icone: "briefcase",
    subcategories: ['Abonnement', 'Banque / Frais', 'Impôts / Taxes', 'Assurance', 'Courrier / Colis', 'Administratif']
  },
  "Bourse": { couleur: "#10b981", icone: "trending-up", subcategories: [] },
  "Épargne": { couleur: "#059669", icone: "piggy-bank", subcategories: ['Livret A', 'PEL', 'Assurance Vie', 'Cryptos', 'Divers'] },
  "Autre": { couleur: "#6b7280", icone: "shopping-cart", subcategories: ['Divers'] },
}

export const CATEGORIES = Object.entries(CATEGORY_STYLES)
  .filter(([name]) => name !== "Revenu" && name !== "Dépense")
  .map(([name, style]) => ({
  value: name,
  label: name,
  color: style.couleur,
  subcategories: style.subcategories
}))

export const getCategoryMetadata = (categories: any[], categoryName: string): CategoryMetadata => {
  // 1. Priorité aux styles statiques du Frontend (Design System)
  const style = CATEGORY_STYLES[categoryName]
  if (style) {
    return {
      nom: categoryName,
      ...style
    }
  }

  // 2. Recherche récursive dans les données API
  const findNodeRecursive = (nodes: any[]): any | null => {
    for (const node of nodes) {
      if (node.nom === categoryName) return node
      if (node.enfants && node.enfants.length > 0) {
        const found = findNodeRecursive(node.enfants)
        if (found) return found
      }
    }
    return null
  }

  const cat = findNodeRecursive(categories)
  if (cat && cat.couleur) {
    return {
      nom: cat.nom,
      couleur: cat.couleur,
      icone: cat.icone || "help-circle"
    }
  }
  
  // 3. Fallback absolu (Bleu Ardoise discret)
  return {
    nom: categoryName,
    couleur: "#94a3b8",
    icone: "help-circle"
  }
}
