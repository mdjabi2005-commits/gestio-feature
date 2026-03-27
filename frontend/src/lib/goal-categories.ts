export interface GoalCategoryMetadata {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const GOAL_CATEGORIES: GoalCategoryMetadata[] = [
  {
    name: "ÉpargneUrgence",
    description: "Fonds d'urgence (3-6 mois de dépenses)",
    icon: "🛡️",
    color: "#10b981",
  },
  {
    name: "ÉpargneVacances",
    description: "Budget vacances",
    icon: "✈️",
    color: "#3b82f6",
  },
  {
    name: "ÉpargneVoiture",
    description: "Épargne pour l'achat d'une voiture",
    icon: "🚗",
    color: "#f59e0b",
  },
  {
    name: "ÉpargneMaison",
    description: "Acompte pour un bien immobilier",
    icon: "🏠",
    color: "#8b5cf6",
  },
  {
    name: "ÉpargneRetraite",
    description: "Plan d'épargne retraite",
    icon: "📈",
    color: "#ec4899",
  },
  {
    name: "ÉpargneAutre",
    description: "Autre objectif d'épargne",
    icon: "💰",
    color: "#6b7280",
  },
];

export function getGoalCategoryMetadata(name: string): GoalCategoryMetadata {
  return GOAL_CATEGORIES.find((c) => c.name === name) || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
}
