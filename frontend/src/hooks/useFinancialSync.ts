import { useState, useCallback, useEffect } from 'react';
import { api } from '@/api';
import type { Budget, Echeance, Objectif, SalaryPlan } from '@/api';

export function useFinancialSync() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [echeancesLoading, setEcheancesLoading] = useState(false);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [objectifsLoading, setObjectifsLoading] = useState(false);
  const [salaryPlans, setSalaryPlans] = useState<SalaryPlan[]>([]);
  const [loadingSalaryPlans, setLoadingSalaryPlans] = useState(false);
  const [categoriesYaml, setCategoriesYaml] = useState<any[]>([]);

  const fetchBudgets = useCallback(async () => {
    setBudgetsLoading(true);
    try { setBudgets(await api.getBudgets()); } catch {}
    finally { setBudgetsLoading(false); }
  }, []);

  const fetchEcheances = useCallback(async () => {
    setEcheancesLoading(true);
    try { setEcheances(await api.getEcheances()); } catch {}
    finally { setEcheancesLoading(false); }
  }, []);

  const fetchObjectifs = useCallback(async () => {
    setObjectifsLoading(true);
    try { setObjectifs(await api.getObjectifs()); } catch {}
    finally { setObjectifsLoading(false); }
  }, []);

  const fetchSalaryPlans = useCallback(async () => {
    setLoadingSalaryPlans(true);
    try { setSalaryPlans(await api.getSalaryPlans()); } catch {}
    finally { setLoadingSalaryPlans(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try { setCategoriesYaml(await api.getCategories()); } catch {}
  }, []);

  const refreshAll = useCallback(() => {
    fetchBudgets();
    fetchEcheances();
    fetchObjectifs();
    fetchSalaryPlans();
    fetchCategories();
  }, [fetchBudgets, fetchEcheances, fetchObjectifs, fetchSalaryPlans, fetchCategories]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  return {
    budgets, budgetsLoading, fetchBudgets,
    echeances, echeancesLoading, fetchEcheances,
    objectifs, objectifsLoading, fetchObjectifs,
    salaryPlans, loadingSalaryPlans, fetchSalaryPlans,
    categoriesYaml, fetchCategories,
    refreshAll
  };
}
