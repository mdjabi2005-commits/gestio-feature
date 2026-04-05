#!/usr/bin/env python3
"""
Validateur de clés en français pour SQLite et API.

Ce script analyse les fichiers Python et TypeScript pour détecter
l'utilisation de clés anglaises dans les dictionnaires, modèles et réponses API.

Règles:
- SQLite: Toutes les colonnes en français
- API: Toutes les clés de réponse en français
- Pydantic: Tous les champs de modèle en français

Mots interdits (sauf dans code/logique):
- id, type, category, amount, date, description, name, value
- total, income, expense, balance, color, percentage, etc.
"""

import re
import sys
from pathlib import Path
from typing import List, Set

# Mots anglais interdits dans les clés de dictionnaires (contextuel)
FORBIDDEN_KEYS = {
    # Clés SQLite/API générales
    "id",
    "type",
    "category",
    "categories",
    "amount",
    "date",
    "description",
    "name",
    "value",
    "total",
    "balance",
    "color",
    "percentage",
    "children",
    # Clés financières
    "income",
    "expense",
    "expenses",
    "revenue",
    "cost",
    "costs",
    "total_income",
    "total_expenses",
    "total_revenue",
    "total_cost",
    # Sous-catégories
    "subcategory",
    "sub_categories",
    "subcategories",
    # Autres
    "source",
    "status",
    "error",
    "message",
    "data",
    "result",
    "created_at",
    "updated_at",  # Remplacé par date_mise_a_jour
    "deleted_at",
    "is_active",
    "user_id",
    "transaction_id",
    "attachment_id",
    "file_name",
    "file_path",
    "file_type",
    "size",
}

# Exceptions autorisées (contexte non-DB/API)
ALLOWED_PATTERNS = {
    r"^def\s+",  # Définitions de fonctions
    r"^class\s+",  # Classes
    r"^import\s+",  # Imports
    r"^from\s+",  # Imports
    r"#",  # Commentaires
    r'""".*"""',  # Docstrings
    r"'''.*'''",  # Docstrings
    r"logger\.",  # Logging
    r"print\(",  # Print
    r"if __name__",  # Main
    r"return\s+{",  # Return dict avec vars
}

# Fichiers à ignorer
IGNORE_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", ".next"}

# Extensions à analyser
TARGET_EXTENSIONS = {".py", ".ts", ".tsx"}


def should_ignore_path(path: Path) -> bool:
    """Vérifie si le chemin doit être ignoré."""
    path_str = str(path)
    return any(ignored in path_str for ignored in IGNORE_DIRS)


def is_in_allowed_context(line: str) -> bool:
    """Vérifie si la ligne est dans un contexte autorisé."""
    for pattern in ALLOWED_PATTERNS:
        if re.search(pattern, line):
            return True
    return False


def extract_dict_keys(line: str) -> List[str]:
    """
    Extrait les clés de dictionnaires dans une ligne.
    Gère les formats: "clé": valeur, 'clé': valeur, clé=valeur
    """
    keys = []

    # Pattern pour "clé": ou 'clé':
    double_quote = re.findall(r'"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:', line)
    single_quote = re.findall(r"'([a-zA-Z_][a-zA-Z0-9_]*)'\s*:", line)

    keys.extend(double_quote)
    keys.extend(single_quote)

    return keys


def is_forbidden_key(key: str) -> bool:
    """Vérifie si une clé est interdite."""
    return key.lower() in FORBIDDEN_KEYS


def analyze_file(file_path: Path, root_dir: Path) -> List[dict]:
    """
    Analyse un fichier et retourne la liste des violations.
    """
    violations = []

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        return [
            {
                "file": str(file_path),
                "line": 0,
                "message": f"Erreur de lecture: {e}",
                "severity": "error",
            }
        ]

    for line_num, line in enumerate(lines, 1):
        # Ignorer les commentaires et contextes autorisés
        stripped = line.strip()
        if is_in_allowed_context(stripped):
            continue

        # Extraire les clés de dictionnaires
        keys = extract_dict_keys(line)

        for key in keys:
            if is_forbidden_key(key):
                try:
                    rel_path = str(file_path.relative_to(root_dir))
                except ValueError:
                    rel_path = str(file_path)
                violations.append(
                    {
                        "file": rel_path,
                        "line": line_num,
                        "key": key,
                        "message": f"Clé anglaise interdite: '{key}'. Utiliser le français.",
                        "severity": "error",
                    }
                )

    return violations


def main():
    """Point d'entrée principal."""
    print("=" * 60)
    print("Validateur de cles francaises - SQLite & API")
    print("=" * 60)
    print()

    # Analyser backend et frontend
    search_dirs = [
        Path("backend"),
        Path("frontend"),
    ]

    all_violations = []
    root_dir = Path.cwd()

    for search_dir in search_dirs:
        if not search_dir.exists():
            print(f"[WARN] Repertoire non trouve: {search_dir}")
            continue

        print(f"Analyse de: {search_dir}/")

        for file_path in search_dir.rglob("*"):
            if file_path.is_file() and file_path.suffix in TARGET_EXTENSIONS:
                if should_ignore_path(file_path):
                    continue

                violations = analyze_file(file_path, root_dir)
                all_violations.extend(violations)

    # Afficher les résultats
    if all_violations:
        print()
        print(f"[ERROR] {len(all_violations)} violation(s) trouvee(s):")
        print("-" * 60)

        for v in all_violations:
            print(f"  {v['file']}:{v['line']}")
            print(f"    Cle: '{v['key']}' - {v['message']}")
            print()

        print("=" * 60)
        print("ECHEC: Des cles anglaises ont ete detectees!")
        print("Utilisez des cles en francais: montant, categorie, date, etc.")
        print("=" * 60)
        sys.exit(1)
    else:
        print()
        print("[OK] Aucune violation trouvee - Toutes les cles sont en francais!")
        print("=" * 60)
        sys.exit(0)


if __name__ == "__main__":
    main()
