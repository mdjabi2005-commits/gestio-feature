import { Objectif } from './types';

const API_BASE_URL = 'http://localhost:8002';

export const objectifsApi = {
  getObjectifs: async (): Promise<Objectif[]> => {
    const res = await fetch(`${API_BASE_URL}/api/goals/`);
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  addObjectif: async (data: Objectif): Promise<Objectif> => {
    const res = await fetch(`${API_BASE_URL}/api/goals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add goal');
    const id = await res.json();
    return { ...data, id };
  },

  updateObjectif: async (id: number, data: Partial<Objectif>): Promise<Objectif> => {
    const res = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    return res.json();
  },

  deleteObjectif: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete goal');
  },
};
