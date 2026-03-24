import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import type { Transaction } from '@/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  { 
    value: 'Alimentation', 
    label: 'Alimentation', 
    color: '#f59e0b',
    subcategories: ['Supermarché', 'Boulangerie', 'Boucherie', 'Marché', 'Fast Food', 'Restaurant', 'Café / Bar', 'Épicerie']
  },
  { 
    value: 'Voiture', 
    label: 'Voiture', 
    color: '#3b82f6',
    subcategories: ['Essence', 'Péage', 'Parking', 'Entretien', 'Réparation', 'Contrôle technique', 'Assurance auto', 'Lavage']
  },
  { 
    value: 'Logement', 
    label: 'Logement', 
    color: '#ec4899',
    subcategories: ['Loyer', 'Électricité', 'Gaz', 'Eau', 'Internet / Téléphone', 'Assurance habitation', 'Travaux', 'Mobilier', 'Électroménager']
  },
  { 
    value: 'Loisirs', 
    label: 'Loisirs', 
    color: '#14b8a6',
    subcategories: ['Cinéma', 'Sport', 'Jeux vidéo', 'Musique', 'Livres', 'Sorties', 'Voyages', 'Streaming']
  },
  { 
    value: 'Santé', 
    label: 'Santé', 
    color: '#ef4444',
    subcategories: ['Pharmacie', 'Médecin', 'Dentiste', 'Optique', 'Mutuelle', 'Hôpital', 'Parapharmacie']
  },
  { 
    value: 'Shopping', 
    label: 'Shopping', 
    color: '#6366f1',
    subcategories: ['Vêtements', 'Chaussures', 'Électronique', 'Informatique', 'Beauté / Cosmétiques', 'Cadeaux', 'Maison / Déco']
  },
  { 
    value: 'Services', 
    label: 'Services', 
    color: '#8b5cf6',
    subcategories: ['Abonnement', 'Banque / Frais', 'Impôts / Taxes', 'Assurance', 'Courrier / Colis', 'Administratif']
  },
  { 
    value: 'Uber', 
    label: 'Uber', 
    color: '#10b981',
    subcategories: ['Livraison']
  },
  { 
    value: 'Autre', 
    label: 'Autre', 
    color: '#6b7280',
    subcategories: ['Divers']
  },
];

const AddTransactionModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [type, setType] = useState<'Dépense' | 'Revenu'>('Dépense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Alimentation');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    try {
      const transaction: Transaction = {
        type,
        date,
        montant: parseFloat(amount),
        categorie: category,
        sous_categorie: subcategory || undefined,
        description: description || undefined,
        source: 'manual'
      };

      await api.addTransaction(transaction);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'ajout');
    }
  };

  return (
    <div className="modal-overlay">
      {/* Backdrop (already handled by modal-overlay in our CSS, but keeping it for style) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="modal-content relative w-full max-w-lg glass-card rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Nouvelle Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('Revenu')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                  type === 'Revenu'
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Revenu
              </button>
              <button
                type="button"
                onClick={() => setType('Dépense')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                  type === 'Dépense'
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                )}
              >
                <TrendingDown className="w-4 h-4" />
                Dépense
              </button>
            </div>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Montant (€)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Catégorie</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory(''); // Reset subcategory on category change
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-slate-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Sous-catégorie</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="">(Aucune)</option>
                {categories.find(c => c.value === category)?.subcategories.map(sub => (
                  <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Courses Carrefour"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-sm text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 relative px-4 py-3 rounded-xl font-medium text-sm text-white overflow-hidden group shadow-lg shadow-indigo-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative">Ajouter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
