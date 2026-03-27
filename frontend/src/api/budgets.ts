// Budget domain API methods

import type { Budget } from './types';

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
};
