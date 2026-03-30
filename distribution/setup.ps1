# setup.ps1 - Préparation de l'environnement pour Gestio

Write-Host "--- Préparation de Gestio ---" -ForegroundColor Cyan

# 1. Vérification de uv
if (!(Get-Command "uv" -ErrorAction SilentlyContinue)) {
    Write-Host "Installation de 'uv'..." -ForegroundColor Yellow
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    $env:Path += ";$env:USERPROFILE\.cargo\bin"
}

# 3. Synchronisation Backend
Write-Host "Synchronisation du Backend (Python)..." -ForegroundColor Green
uv sync

Write-Host "--- Fin de la préparation ✅ ---" -ForegroundColor Cyan
