# Architecture OCR Core

Ce module constitue la couche **bas niveau** du moteur de reconnaissance. Il encapsule les bibliothèques tierces pour
fournir une abstraction propre au reste de l'application.

## 🛠️ Stack Technique

### 1. RapidOCR (`rapidocr_onnxruntime`)

- **Rôle** : Moteur OCR principal pour les images.
- **Pourquoi ?** :
    - Plus léger et rapide que Tesseract.
    - Utilise `ONNX Runtime` pour une inférence CPU optimisée.
    - Supporte nativement la détection de texte orienté (pas seulement horizontal).
- **Fichier** : `rapidocr_engine.py`

### 2. PDFMiner (`pdfminer.six`)

- **Rôle** : Extraction de texte depuis les PDF natifs (relevés bancaires).
- **Pourquoi ?** :
    - Extraction précise de la structure (positions).
    - Pas de conversion image nécessaire (plus rapide et précis que l'OCR sur PDF).
- **Fichier** : `pdf_engine.py`

### 3. PDFPlumber (`pdfplumber`)

- **Rôle** : Alternative pour les PDF avec tableaux complexes (fiches de paie).
- **Fichier** : `pdfplumber_engine.py`

### 4. OpenCV (`opencv-python-headless`)

- **Rôle** : Prétraitement d'image.
- **Opérations** :
    - Redimensionnement (pour améliorer la détection des petits textes).
    - Binarisation / Seuillage (pour nettoyer le bruit de fond).
    - Désinclinaison (Deskewing).

### 5. Regex & Parsing

- **Rôle** : Extraction structurée depuis le texte brut.
- **Fichiers** : `parser.py`, `groq_parser.py` (LLM-based pour parsing complexe).

### 6. Groq Parser (`groq_parser.py`)

- **Rôle** : Utilise l'API Groq pour parser les documents complexes via LLM.
- **Pourquoi ?** :
    - Meilleure compréhension du contexte pour les tickets malformés.
    - Rapidité grâce à l'inférence Groq.
- **Variable d'environnement** : `GROQ_API_KEY`

## 🧩 Diagramme de Classe Simplifié

```mermaid
classDiagram
    class RapidOCREngine {
        +extract_text(image_path) str
    }
    
    class PDFEngine {
        +extract_text_from_pdf(pdf_path) str
    }
    
    class Parser {
        +parse_amount(text) float
        +parse_date(text) date
    }
    
    RapidOCREngine --|> Preprocessing : uses
    PDFEngine --|> PDFMiner : uses
```
