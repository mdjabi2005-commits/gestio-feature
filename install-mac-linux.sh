#!/bin/bash
# Gestio — Installeur Mac/Linux
# Aucun prérequis : uv installe Python + toutes les dependances
# Usage : chmod +x install-mac-linux.sh && ./install-mac-linux.sh

set -e

REPO="https://github.com/mdjabi2005-commits/gestion-financi-re.git"


echo ""
echo "Gestio — Installation"
echo "---------------------"

# 1. Installer uv si absent (binaire standalone, pas besoin de Python)
if ! command -v uv &> /dev/null; then
    echo "Installation de uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
    source "$HOME/.bashrc" 2>/dev/null || source "$HOME/.zshrc" 2>/dev/null || true
fi
echo "uv $(uv --version)"

# 2. Installer Gestio comme outil global via uv tool
#    - Telecharge uniquement les sources (pas de binaire lourd)
#    - Cree un virtualenv isole automatiquement
#    - Expose la commande `gestio` dans le PATH
echo "Installation de Gestio..."
uv tool install "git+$REPO" --python 3.12

# 3. S'assurer que le PATH de uv tools est dans le shell
uv tool update-shell 2>/dev/null || true

echo ""
echo "Installation terminee !"
echo "Pour lancer Gestio : gestio"
echo ""

# 4. Lancer directement
gestio
