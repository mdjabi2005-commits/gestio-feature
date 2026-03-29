import { Echeance, Transaction } from "@/api";

/**
 * Calcule les dates d'occurrence d'une échéance pour un mois spécifique.
 */
export function getMonthOccurrences(echeance: Echeance, year: number, month: number): Date[] {
  if (!echeance.date_debut || !echeance.frequence) {
    return [];
  }
  
  const start = new Date(echeance.date_debut);
  if (isNaN(start.getTime())) {
    return [];
  }
  
  const end = echeance.date_fin ? new Date(echeance.date_fin) : null;
  const targetMonthStart = new Date(year, month, 1);
  const targetMonthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const occurrences: Date[] = [];
  let current = new Date(start);

  const freq = echeance.frequence.toLowerCase();
  
  const addDelta = (d: Date): Date | null => {
    const next = new Date(d);
    if (freq.includes("mensuel") || freq.includes("mensuelle")) next.setMonth(next.getMonth() + 1);
    else if (freq.includes("hebdomadaire")) next.setDate(next.getDate() + 7);
    else if (freq.includes("quotidien") || freq.includes("quotidienne")) next.setDate(next.getDate() + 1);
    else if (freq.includes("annuel") || freq.includes("annuelle")) next.setFullYear(next.getFullYear() + 1);
    else if (freq.includes("trimestriel") || freq.includes("trimestrielle")) next.setMonth(next.getMonth() + 3);
    else if (freq.includes("semestriel") || freq.includes("semestrielle")) next.setMonth(next.getMonth() + 6);
    else return null;
    return next;
  };

  // Optimisation : Sauter vers le mois cible si possible (pour mensuel/annuel)
  // Mais attention au jour du mois (ex: 31 du mois)
  
  while (current <= targetMonthEnd) {
    if (current >= targetMonthStart && (!end || current <= end)) {
      occurrences.push(new Date(current));
    }
    const next = addDelta(current);
    if (!next || next.getTime() <= current.getTime()) break;
    current = next;
  }

  return occurrences;
}

/**
 * Calcule le montant total prévu par catégorie pour le mois en cours,
 * en excluant les échéances déjà payées.
 */
function calculatePlannedByType(
  type: 'depense' | 'revenu',
  echeances: any[],
  transactions: Transaction[],
  year: number,
  month: number
): Record<string, number> {
  const plannedMap: Record<string, number> = {};
  
  const paidEcheanceIds = new Set(
    transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.echeance_id && d.getFullYear() === year && d.getMonth() === month && t.type === type;
      })
      .map(t => t.echeance_id)
  );

  echeances.forEach(ech => {
    const statut = ech.statut || ech.status || 'active';
    if (statut === 'inactive') return;
    
    const echType = ech.type || (type === 'revenu' ? 'revenu' : 'depense');
    if (echType !== type) return;

    const occurrences = getMonthOccurrences(ech, year, month);
    const amount = Number(ech.montant || ech.amount) || 0;
    
    if (paidEcheanceIds.has(ech.id)) {
      const freq = (ech.frequence || "").toLowerCase();
      if (!freq.includes("hebdomadaire") && !freq.includes("quotidien")) {
        return;
      }
      
      const paidCount = transactions.filter(t => t.echeance_id === ech.id && t.type === type).length;
      const totalOccurrences = occurrences.length;
      const remainingOccurrences = Math.max(0, totalOccurrences - paidCount);
      
      if (remainingOccurrences > 0) {
        const cat = (ech.categorie || ech.category || '').trim();
        if (cat) plannedMap[cat] = (plannedMap[cat] ?? 0) + (remainingOccurrences * amount);
      }
    } else {
      const totalAmount = occurrences.length * amount;
      if (totalAmount > 0) {
        const parentKey = (ech.categorie || ech.category || '').trim();
        const subKey = ech.sous_categorie ? `${parentKey} > ${(ech.sous_categorie || '').trim()}` : null;
        
        if (parentKey) plannedMap[parentKey] = (plannedMap[parentKey] ?? 0) + totalAmount;
        if (subKey && parentKey) {
          plannedMap[subKey] = (plannedMap[subKey] ?? 0) + totalAmount;
        }
      }
    }
  });

  return plannedMap;
}

export function calculatePlannedExpenses(
  echeances: any[],
  transactions: Transaction[],
  year: number,
  month: number
): Record<string, number> {
  return calculatePlannedByType('depense', echeances, transactions, year, month);
}

export function calculatePlannedIncomes(
  echeances: any[],
  transactions: Transaction[],
  year: number,
  month: number
): Record<string, number> {
  return calculatePlannedByType('revenu', echeances, transactions, year, month);
}

// Keep backward compatibility for now if needed, but we should update callers
export const calculatePlannedByTarget = calculatePlannedExpenses;
