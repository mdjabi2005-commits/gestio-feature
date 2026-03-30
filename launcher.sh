#!/bin/bash
# Démarrage de Gestio pour environnements Unix (Mac / Linux)

cd "$(dirname "$0")"

echo "Démarrage de l'environnement Python..."
uv run launcher.py
