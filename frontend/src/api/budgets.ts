// Budget domain API methods

import type { Budget, SalaryPlan } from './types';

const API_BASE_URL = 'http://localhost:8002';

export const budgetsApi = {
  getBudgets: async (): Promise<Budget[]> => {
    const res = await fetch(`${API_BASE_URL}/api/budgets/`);
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },

  setBudget: async (data: Budget): Promise<Budget> => {
    const res = await fetch(`${API_BASE_URL}/api/budgets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to set budget');
    return res.json();
  },

  deleteBudget: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/budgets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete budget');
  },

  getSalaryPlans: async (): Promise<SalaryPlan[]> => {
    const res = await fetch(`${API_BASE_URL}/api/budgets/salary-plans`);
    if (!res.ok) throw new Error('Failed to fetch salary plans');
    return res.json();
  },

  saveSalaryPlan: async (plan: SalaryPlan): Promise<SalaryPlan> => {
    const method = plan.id ? 'PUT' : 'POST';
    const url = plan.id
      ? `${API_BASE_URL}/api/budgets/salary-plans/${plan.id}`
      : `${API_BASE_URL}/api/budgets/salary-plans`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error('Failed to save salary plan');
    return res.json();
  },

  deleteSalaryPlan: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/budgets/salary-plans/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete salary plan');
  },
};
