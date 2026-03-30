@echo off
pushd "%~dp0"
echo Démarrage de l'environnement Python...
uv run launcher.py
popd
exit
