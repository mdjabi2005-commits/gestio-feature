import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { Transaction } from '../api';

interface Props {
  onSelect?: (id: number) => void;
}

const TransactionList: React.FC<Props> = ({ onSelect }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactions()
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="card">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Catégorie</th>
            <th>Montant</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr 
              key={t.id} 
              onClick={() => t.id && onSelect?.(t.id)}
              className="clickable-row"
            >
              <td>{t.date}</td>
              <td className={t.type === 'Revenu' ? 'text-green' : 'text-red'}>{t.type}</td>
              <td>{t.categorie}</td>
              <td className="font-bold">{t.montant.toFixed(2)} €</td>
              <td>{t.description}</td>
              <td>
                <button className="btn-icon">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;
