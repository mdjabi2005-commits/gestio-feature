#!/bin/bash
# Démarrage de Gestio pour environnements Unix (Mac / Linux)

cd "$(dirname "$0")"

echo "=================================================="
echo "        Démarrage de Gestio                       "
echo "=================================================="

# Vérifier si uv est installé
if ! command -v uv &> /dev/null; then
    echo "[Installation] Outil 'uv' non détecté. Installation en cours..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Mettre à jour le PATH temporairement pour la session en cours
    export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
fi

echo "[Démarrage] Lancement de l'environnement Python..."
uv run launcher.py
