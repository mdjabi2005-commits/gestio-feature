@echo off
pushd "%~dp0"
echo ==================================================
echo         Demarrage de Gestio
echo ==================================================

:: Verifier si uv est installe
where uv >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [Installation] Outil 'uv' non detecte. Installation en cours...
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    
    :: Ajouter uv au PATH de cette session pour pouvoir l'utiliser tout de suite
    set "PATH=%USERPROFILE%\.cargo\bin;%USERPROFILE%\.local\bin;%PATH%"
)

echo [Demarrage] Lancement de l'environnement Python...
uv run launcher.py
popd
