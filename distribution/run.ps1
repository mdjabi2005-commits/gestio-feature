# run.ps1 - Lancement de Gestio

$BackendPort = 8002
$FrontendPort = 3000

# 1. Vérification des dépendances (si pas de venv)
if (!(Test-Path ".venv")) {
    & ".\distribution\setup.ps1"
}

# 2. Lancement Backend (Fenêtre masquée)
Write-Host "Démarrage du Backend et du Frontend..." -ForegroundColor Green
Start-Process "uv" -ArgumentList "run", "uvicorn", "backend.main:app", "--port", "$BackendPort" -WindowStyle Hidden

# 3. Attente de la disponibilité de l'application
Write-Host "En attente de l'application..." -ForegroundColor Yellow
$MaxRetries = 30
$RetryCount = 0
$Ready = $false

while (!$Ready -and $RetryCount -lt $MaxRetries) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        # On vérifie sur le port 8002 (Backend qui sert le Frontend)
        $tcp.Connect("127.0.0.1", $BackendPort)
        if ($tcp.Connected) { $Ready = $true }
        $tcp.Close()
    } catch {
        Start-Sleep -Seconds 1
        $RetryCount++
    }
}

if ($Ready) {
    Write-Host "Lancement de Chrome en mode App ✅" -ForegroundColor Green
    # Chrome sur port 8002 car le backend sert le frontend
    if (Get-Command "google-chrome" -ErrorAction SilentlyContinue) {
        & "google-chrome" --app="http://localhost:$BackendPort"
    } elseif (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe") {
        & "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:$BackendPort"
    } elseif (Test-Path "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe") {
        & "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="http://localhost:$BackendPort"
    } else {
        # Fallback browser par défaut
        Start-Process "http://localhost:$BackendPort"
    }
} else {
    Write-Host "ERREUR: Temps d'attente dépassé pour le démarrage du serveur." -ForegroundColor Red
}
