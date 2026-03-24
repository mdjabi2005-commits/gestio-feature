# Icônes — Gestio V4

## Générer les icônes automatiquement

```bash
uv run python resources/icons/generate_icons.py
```

Génère les 3 fichiers depuis zéro (aucun prérequis externe) :

| Fichier       | Usage                       | Généré par          |
|---------------|-----------------------------|---------------------|
| `gestio.png`  | Linux (AppImage + taskbar)  | `generate_icons.py` |
| `gestio.ico`  | Windows (.exe + Inno Setup) | `generate_icons.py` |
| `gestio.icns` | macOS (.app bundle)         | `generate_icons.py` |

## Utiliser ton propre logo

1. Remplace `gestio.png` par ton logo (512x512 PNG, fond transparent)
2. Relance le script :

```bash
uv run python resources/icons/generate_icons.py
```

Le script régénère `.ico` et `.icns` depuis ton PNG automatiquement.
