# Mission pour l'Agent Backend (Claude/Minimax) - Scan & Split Revenus

Bonjour,

Voici les spécifications pour la gestion des **Plans de Salaire (Salary Plans)** et leur application lors du scan des fiches de paie.

## 1. Modèle de Données (SalaryPlan)

Le backend doit stocker les plans de répartition avec la structure suivante :

```yaml
salary_plan:
  name: "Mon Plan Standard"
  is_active: true
  default_remainder_category: "Épargne" # Catégorie pour le reliquat non alloué
  
  allocations:
    - category: "Besoins"
      value: 20
      type: "percent" # 'percent' ou 'fixed'
      sub_distribution_mode: "equal" # 'equal' ou 'manual'
      
    - category: "Loisirs"
      value: 30
      type: "percent"
      sub_distribution_mode: "manual"
      sub_allocations:
        - name: "Cinéma"
          value: 70  # % de l'enveloppe de la catégorie 'Loisirs'
        - name: "Jeux Vidéo"
          value: 30  # % de l'enveloppe de la catégorie 'Loisirs'
```

### Modes de Distribution (`sub_distribution_mode`) :
- **`equal`** (Défaut) : L'enveloppe de la catégorie est divisée en parts égales entre **toutes** ses sous-catégories définies dans `categories.yaml`.
- **`manual`** : Seules les sous-catégories listées dans `sub_allocations` reçoivent un montant (basé sur le pourcentage de l'enveloppe parente).

## 2. API Endpoints

- CRUD complet pour `/api/ocr/salary-plans`.
- `POST /api/ocr/scan-income` :
  1. Extraire le **Net à payer** du PDF.
  2. Si un plan **actif** existe, l'utiliser pour générer les `suggested_splits`.
  3. **Règle du Reliquat** : Tout montant du salaire net non alloué par les règles explicites doit être affecté à la catégorie `default_remainder_category`.
  
## 4. Archivage Automatique (OBLIGATOIRE)

Lorsqu'un scan de fiche de paie (`scan-income`) est réussi, le backend doit assurer l'archivage physique du document :
- **Dossier cible** : `REVENUS_TRAITES / Epargne / <Sous-Catégorie> / <Nom_Fichier>`.
- **Action** : Identifier la sous-catégorie dominante (ex: `Salaire`) et déplacer le fichier temporaire vers ce chemin structuré dès que le montant net est extrait.

## 5. Synchronisation Budgétaire

- **Modèle** : Ajouter `reference_salary` (float) au modèle `SalaryPlanResponse`.
- **Logiciel** : Lors du `save_salary_plan`, si un `reference_salary > 0` est présent, calculer les montants en Euros pour chaque allocation et effectuer un `upsert` dans le repository des Budgets (catégorie + montant calculé).

## 6. Configuration OCR (Groq)

Le frontend peut désormais configurer une clé API Groq pour l'OCR.
- **Endpoints** :
    - `GET /api/ocr/config` : Retourne la configuration actuelle (ex: `{ "api_key": "gsk_..." }`).
    - `POST /api/ocr/config` : Sauvegarde la clé API fournie.
- **Persistance** : La clé doit être stockée de manière persistante (ex: dans le fichier `.env` via `python-dotenv` ou un fichier de config dédié dans `backend/config/`).
- **Usage** : Cette clé doit ensuite être utilisée par le moteur OCR Groq.

## 7. Traitement des Sous-Allocations (Nouveau)

L'interface a été simplifiée : plus de mode "Auto/Manual" explicite.
- **Traitement des sous-allocations (Budget sync)** :
    - Si `sub_allocations` est une liste non-vide (ex: `[{ "name": "Loyer", "value": 50 }, ...]`), le backend DOIT utiliser ces pourcentages pour créer/mettre à jour les budgets correspondants dans `budget_repository`.
    - **FALLBACK IMPORTANT** : Si `sub_allocations` est **vide** ou absent du JSON, le backend DOIT diviser équitablement (ex: 1/N) le montant total de la catégorie entre **toutes** les sous-catégories connues pour cette catégorie (ex: 'Loyer', 'Électricité', etc. pour 'Logement').

---

# NOUVEAU : Mission Archivage OCR & Folder Watcher (Tickets)

L'agent Frontend (Gemini) a identifié un besoin d'automatisation pour le tunnel OCR des tickets. Merci d'implémenter les fonctionnalités suivantes :

## 1. Archivage Structuré des Documents
Actuellement, les tickets scannés sont supprimés après traitement. Ils doivent être archivés physiquement.

- **Tickets (Images)** : Déplacer vers `SORTED_DIR / <Catégorie> / <Sous-Catégorie> / <Nom_Fichier>`.
- **Revenus (PDF)** : Déplacer vers `REVENUS_TRAITES / <Catégorie> / <Sous-Catégorie> / <Nom_Fichier>`.
- **Règle de nommage** : Préserver le nom original (en enlevant les préfixes `ocr_` ou `income_` temporaires). En cas de doublon, ajouter un suffixe numérique (ex: `ticket_1.jpg`).

## 2. Détection Automatique (Folder Watcher) & API
Mettre en place un mécanisme pour détecter les fichiers déposés manuellement dans `TO_SCAN_DIR`.

- **Emplacement** : Créer `backend/api/ocr/watcher.py`.
- **API** : Ajouter `POST /api/ocr/scan-pending` qui force le scan immédiat du dossier `TO_SCAN_DIR` et retourne la liste des transactions créées.
- **Logique** :
    1. Scanner périodiquement `TO_SCAN_DIR` (ex: toutes les 60s ou via un thread de fond).
    2. Pour chaque fichier valide (Image/PDF) :
        - Appeler `OCRService` pour extraire les données.
        - Créer la/les transaction(s) en base via `transaction_repository.add()`.
        - Archiver le fichier dans la structure définie au point 1.
        - Supprimer le fichier source du dossier `TO_SCAN_DIR`.

## 3. Configuration & Intégration
- **`backend/config/paths.py`** : S'assurer que `TO_SCAN_DIR`, `SORTED_DIR` et `REVENUS_TRAITES` sont créés au démarrage.
- **`backend/main.py`** : Lancer le watcher dans le `lifespan` de l'application FastAPI.

## Dossiers Cibles (Contexte utilisateur)
- SOURCE : "C:\Users\djabi\Desktop\tickets"
- TO_SCAN_DIR : "C:\Users\djabi\test\tickets_a_scanner"
- SORTED_DIR : "C:\Users\djabi\test\tickets_tries"

---

# NOUVEAU : Mission 🔧 Fix Catégorisation Groq (URGENT)

L'agent Frontend (Gemini) a identifié un bug majeur empêchant la catégorisation automatique des tickets.

## 1. Conflit de Configuration (Action Immédiate)
- **Problème** : Le fichier `backend/config/ocr_config.json` contient une clé fictive `"gsk_validkey"`. Le code du backend (`ocr_config.py`) privilégie ce fichier par rapport au fichier `.env`.
- **Action** : **Supprimer** le fichier `backend/config/ocr_config.json` ou s'assurer qu'il est vide pour laisser la clé réelle du `.env` être utilisée.

## 2. Correction de l'Endpoint API
- **Fichier** : `backend/api/ocr/ocr.py`
- **Endpoint** : `POST /api/ocr/config`
- **Problème** : L'argument `api_key: str = None` est interprété par FastAPI comme un Query Param. Le frontend l'envoie en JSON Body.
- **Action** : Créer un modèle Pydantic :
  ```python
  class OCRUpdate(BaseModel):
      api_key: str
  ```
  Et mettre à jour l'endpoint pour utiliser `api_key: OCRUpdate`.

## 3. Validation
- Vérifier que `get_groq_api_key()` retourne bien la clé commençant par `gsk_AKIg...` (depuis le `.env`) une fois le JSON supprimé.
