#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gestio V4 - Launcher Core

Logique metier du launcher : resolution des chemins, health-check venv,
uv sync, lancement Streamlit, kill port.
"""

import os
import shutil
import socket
import subprocess
import sys
from pathlib import Path

PORT = 8501
STARTUP_TIMEOUT = 30  # secondes


def resolve_app_dir() -> Path:
    """Retourne le dossier app/ cote de l'EXE : %APPDATA%\\Gestio\\app"""
    return Path(sys.executable).parent / "app"


def resolve_uv_path() -> str:
    """Retourne uv.exe embarque cote de l'EXE : %APPDATA%\\Gestio\\uv\\uv.exe"""
    return str(Path(sys.executable).parent / "uv" / "uv.exe")


def is_port_in_use(port: int) -> bool:
    """Verifie si un port TCP est deja utilise."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def kill_port(port: int) -> None:
    """Tue le processus qui ecoute sur le port donne."""
    try:
        r = subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
        for line in r.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                subprocess.run(
                    ["taskkill", "/F", "/PID", line.split()[-1]],
                    capture_output=True,
                )
    except Exception:
        pass


def find_chrome() -> str | None:
    """Cherche Chrome sur le systeme Windows."""
    for p in [r"%PROGRAMFILES%", r"%PROGRAMFILES(X86)%", r"%LOCALAPPDATA%"]:
        chrome = Path(os.path.expandvars(p)) / "Google/Chrome/Application/chrome.exe"
        if chrome.exists():
            return str(chrome)
    return None


def build_streamlit_env() -> dict[str, str]:
    """Variables d'environnement pour Streamlit (theme + config)."""
    env = os.environ.copy()
    env.update({
        "STREAMLIT_SERVER_HEADLESS": "true",
        "STREAMLIT_SERVER_PORT": str(PORT),
        "STREAMLIT_BROWSER_GATHER_USAGE_STATS": "false",
        "STREAMLIT_GLOBAL_DEVELOPMENT_MODE": "false",
        "STREAMLIT_THEME_BASE": "dark",
        "STREAMLIT_THEME_PRIMARY_COLOR": "#10B981",
        "STREAMLIT_THEME_BACKGROUND_COLOR": "#111827",
        "STREAMLIT_THEME_SECONDARY_BACKGROUND_COLOR": "#1E293B",
        "STREAMLIT_THEME_TEXT_COLOR": "#F8FAFC",
        "STREAMLIT_THEME_FONT": "sans serif",
    })
    return env


def venv_is_healthy(app_dir: Path) -> bool:
    """Verifie que le venv existe et que python.exe repond correctement."""
    venv_python = app_dir / ".venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        return False
    try:
        r = subprocess.run(
            [str(venv_python), "-c", "import sys; print(sys.version)"],
            capture_output=True, timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        return r.returncode == 0
    except Exception:
        return False


def sync_dependencies(app_dir: Path, uv_path: str) -> tuple[bool, str]:
    """
    Installe/repare le venv via uv sync.
    Supprime le venv corrompu avant de relancer.
    Retourne (succes, message_erreur).
    """
    venv_dir = app_dir / ".venv"

    if venv_is_healthy(app_dir):
        return True, ""

    if venv_dir.exists():
        shutil.rmtree(venv_dir, ignore_errors=True)

    result = subprocess.run(
        [uv_path, "sync", "--frozen"],
        cwd=str(app_dir),
        capture_output=True,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    if result.returncode != 0:
        err = result.stderr.decode("utf-8", errors="replace")
        return False, err

    return True, ""


def build_streamlit_cmd(uv_path: str, main_app: Path) -> list[str]:
    """Construit la commande uv run streamlit."""
    return [
        uv_path, "run", "--no-sync", "streamlit", "run", str(main_app),
        "--server.port", str(PORT),
        "--server.headless", "true",
        "--browser.gatherUsageStats", "false",
    ]

