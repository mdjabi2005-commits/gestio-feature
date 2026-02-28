# 🚀 Build & Distribution — Gestio V4

## 📦 Stratégie par plateforme

| Plateforme     | Pipeline                              | Résultat final          | Prérequis utilisateur                 |
|----------------|---------------------------------------|-------------------------|---------------------------------------|
| 🪟 **Windows** | PyInstaller `onedir` → Inno Setup     | `Gestio-Setup-v4.0.exe` | **Aucun** — assistant d'installation  |
| 🍎 **macOS**   | PyInstaller `onedir` → `create-dmg`   | `Gestio-macOS.dmg`      | **Aucun** — glisser dans Applications |
| 🐧 **Linux**   | PyInstaller `onedir` → `appimagetool` | `Gestio-Linux.AppImage` | **Aucun** — fichier portable          |

---

## 🔑 Prérequis de build (une seule fois)

```bash
# Installer uv (si pas déjà fait)
curl -LsSf https://astral.sh/uv/install.sh | sh   # Mac/Linux
# ou
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"  # Windows

# Synchroniser l'environnement depuis uv.lock
uv sync --frozen

# Ajouter PyInstaller (hors uv.lock, outil de build uniquement)
uv pip install pyinstaller
```

> ⚠️ Placer les icônes dans `resources/icons/` avant de builder.
> Voir `resources/icons/README.md` pour les formats requis.

---

## 🔨 Build manuel

```bash
# Build onedir (résultat : dist/GestioV4/)
uv run pyinstaller gestio.spec --noconfirm

# Windows uniquement — générer l'installeur avec Inno Setup
iscc gestio.iss
# Résultat : dist/installer/Gestio-Setup-v4.0.exe
```

---

## 🤖 Release automatique — GitHub Actions

Le workflow `.github/workflows/build.yml` utilise une **`strategy: matrix`** pour
builder les 3 plateformes **en parallèle** sur les runners GitHub.

```
tag v1.0.0
    │
    ├── 🪟 windows-latest  → PyInstaller → Inno Setup → Gestio-Setup-v1.0.0.exe
    ├── 🍎 macos-latest    → PyInstaller → create-dmg → Gestio-macOS.dmg
    └── 🐧 ubuntu-22.04    → PyInstaller → appimagetool → Gestio-Linux.AppImage
                │
                └── release job → GitHub Release avec les 3 fichiers
```

### Déclencher une release

```bash
git add .
git commit -m "feat: version 1.0.0"
git tag v1.0.0
git push origin v1.0.0   # ← déclenche le workflow
```

---

## 🔒 Note confidentialité

Les données de l'utilisateur sont stockées **uniquement sur sa machine** (`~/analyse/` ou `~/Gestio/analyse/` sur
Windows).
Aucune donnée n'est transmise sur internet lors de l'utilisation.
