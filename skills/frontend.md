# Skill: Frontend (React + TypeScript)

Instructions pour travailler sur le frontend de Gestio V4.

## Contexte du projet

- **Stack** : React 19, TypeScript, Tailwind CSS, Vite
- **Client API** : Communique avec le backend FastAPI sur http://localhost:8001
- **Serveur dev** : http://localhost:5173

## Fichiers clés

- `frontend/src/api.ts` — Client API
- `frontend/src/app/` — Pages (dashboard, transactions, settings, recurrences)
- `frontend/src/components/` — Composants UI réutilisables

## Commandes

```bash
cd frontend
npm install          # Installer les dépendances
npm run dev          # Serveur de dev
npm run build        # Build production
npm run lint         # Vérification du code
```

## Règles

1. **TypeScript strict** — pas de `any`, types explicites requis
2. **Composants client** uniquement (pas de Server Components avec Vite)
3. **Styling** — Tailwind CSS uniquement, pas de styles inline ou modules CSS
4. **Naming** :
   - Composants : `PascalCase` (ex: `TransactionTable.tsx`)
   - Hooks : `useXxx.ts`
   - Utils : `camelCase`
5. **Appels API** — utiliser le client centralisé dans `src/api.ts`

## Taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes** doit être subdivisé.

## Exemple de composant

```tsx
interface TransactionProps {
  id: number;
  date: string;
  montant: number;
  categorie: string;
}

export function TransactionRow({ transaction }: { transaction: TransactionProps }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2">{transaction.date}</td>
      <td className="px-4 py-2">{transaction.categorie}</td>
      <td className="px-4 py-2 font-medium">€{transaction.montant.toFixed(2)}</td>
    </tr>
  );
}
```

## Utilisation de l'API

```typescript
import { api } from '@/api';

const transactions = await api.getTransactions();
await api.addTransaction({ type: 'Dépense', montant: 100, date: '2026-03-24', categorie: 'Alimentation' });
```

## Tests

Pas de tests unitaires requis pour les composants frontend dans ce projet.