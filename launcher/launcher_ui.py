#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gestio V4 - Launcher UI

Fenetre Tkinter du launcher. Orchestre launcher_core pour le
demarrage de Streamlit.
"""

import datetime
import subprocess
import threading
import time
import tkinter as tk
import webbrowser
from pathlib import Path
from tkinter import scrolledtext

from launcher_core import (
    PORT, STARTUP_TIMEOUT,
    build_streamlit_cmd, build_streamlit_env,
    find_chrome, is_port_in_use, kill_port,
    sync_dependencies,
)

APP_NAME = "Gestio V4"

# Palette Catppuccin Mocha
C_BG, C_BG2, C_FG = "#1E1E2E", "#313244", "#CDD6F4"
C_ACCENT, C_OK, C_ERR, C_WARN = "#89B4FA", "#A6E3A1", "#F38BA8", "#FAB387"


class Launcher:
    """Fenetre Tkinter de lancement de Gestio."""

    def __init__(self, app_dir: Path, uv_path: str) -> None:
        self.app_dir = app_dir
        self.uv_path = uv_path
        self.process: subprocess.Popen | None = None
        self.is_running: bool = False
        self.show_logs: bool = False

        self.root = tk.Tk()
        self.root.title(f"{APP_NAME} - Launcher")
        self.root.geometry("600x450")
        self.root.configure(bg=C_BG)
        self.root.resizable(False, False)
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        self._build_ui()
        self.root.after(100, self.start_app)

    # ── UI ────────────────────────────────────────────────────────────────────

    def _build_ui(self) -> None:
        hdr = tk.Frame(self.root, bg=C_BG)
        hdr.pack(fill=tk.X, padx=30, pady=(30, 20))
        tk.Label(hdr, text="Gestio", font=("Segoe UI", 32, "bold"),
                 bg=C_BG, fg=C_FG).pack()
        tk.Label(hdr, text="Gestionnaire Financier Personnel",
                 font=("Segoe UI", 11), bg=C_BG, fg=C_ACCENT).pack(pady=(5, 0))

        self.btn_launch = tk.Button(
            self.root, text="Lancer l'Application", command=self.start_app,
            bg=C_OK, fg=C_BG, font=("Segoe UI", 16, "bold"),
            padx=40, pady=20, relief=tk.FLAT, cursor="hand2",
        )
        self.btn_launch.pack(pady=20)

        tk.Label(self.root, text="S'ouvre automatiquement en mode plein ecran",
                 font=("Segoe UI", 10), bg=C_BG, fg=C_FG).pack(pady=15)

        row = tk.Frame(self.root, bg=C_BG)
        row.pack(pady=10)
        self.btn_logs = tk.Button(
            row, text="Afficher les logs", command=self.toggle_logs,
            bg=C_BG2, fg=C_FG, font=("Segoe UI", 10),
            padx=15, pady=8, relief=tk.FLAT,
        )
        self.btn_logs.pack(side=tk.LEFT, padx=5)
        self.btn_stop = tk.Button(
            row, text="Arreter", command=self.stop_app,
            bg=C_BG2, fg=C_FG, font=("Segoe UI", 10),
            padx=15, pady=8, relief=tk.FLAT, state=tk.DISABLED,
        )
        self.btn_stop.pack(side=tk.LEFT, padx=5)

        self.log_frame = tk.Frame(self.root, bg=C_BG)
        tk.Label(self.log_frame, text="Logs", font=("Segoe UI", 10, "bold"),
                 bg=C_BG, fg=C_ACCENT).pack(anchor="w", padx=20, pady=(10, 5))
        self.log_area = scrolledtext.ScrolledText(
            self.log_frame, height=10, bg=C_BG2, fg=C_FG,
            font=("Consolas", 9), relief=tk.FLAT, state=tk.DISABLED,
            borderwidth=0,
        )
        self.log_area.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 10))
        self.log_area.tag_config("error", foreground=C_ERR)
        self.log_area.tag_config("warn", foreground=C_WARN)
        self.log_area.tag_config("ok", foreground=C_OK)

        bar = tk.Frame(self.root, bg=C_BG2, height=35)
        bar.pack(side=tk.BOTTOM, fill=tk.X)
        self.status_label = tk.Label(
            bar, text="Pret", bg=C_BG2, fg=C_OK,
            font=("Segoe UI", 9), anchor="w",
        )
        self.status_label.pack(side=tk.LEFT, padx=15, pady=8)

    def toggle_logs(self) -> None:
        self.show_logs = not self.show_logs
        if self.show_logs:
            self.log_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 10))
            self.btn_logs.config(text="Masquer les logs")
            self.root.geometry("600x650")
        else:
            self.log_frame.pack_forget()
            self.btn_logs.config(text="Afficher les logs")
            self.root.geometry("600x450")

    def log(self, msg: str, tag: str = "") -> None:
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        self.log_area.config(state=tk.NORMAL)
        self.log_area.insert(tk.END, f"[{ts}] {msg}\n", tag)
        self.log_area.see(tk.END)
        self.log_area.config(state=tk.DISABLED)

    def status(self, text: str, color: str = C_FG) -> None:
        self.status_label.config(text=text, fg=color)

    def _ui_running(self) -> None:
        self.btn_launch.config(text="Lancee", bg=C_OK, state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)
        self.status("En cours", C_OK)

    def _ui_error(self) -> None:
        self.btn_launch.config(text="Relancer", bg=C_ERR, state=tk.NORMAL)
        self.status("Erreur", C_ERR)
        if not self.show_logs:
            self.toggle_logs()

    # ── Logique de lancement ─────────────────────────────────────────────────

    def start_app(self) -> None:
        if self.is_running:
            return
        self.btn_launch.config(state=tk.DISABLED, text="Demarrage...")
        self.status("Demarrage...", C_WARN)
        if is_port_in_use(PORT):
            kill_port(PORT)
            time.sleep(1)
        threading.Thread(target=self._run, daemon=True).start()

    def _run(self) -> None:
        try:
            # Etape 1 : venv sain ?
            venv_exists = (self.app_dir / ".venv").exists()
            if not venv_exists:
                self.root.after(0, self.log,
                                "Installation des dependances (premiere fois)...")
                self.root.after(0, self.status, "Installation...", C_WARN)
            else:
                self.root.after(0, self.log, "Verification du venv...")

            ok, err_msg = sync_dependencies(self.app_dir, self.uv_path)
            if not ok:
                self.root.after(0, self.log, f"uv sync echoue :\n{err_msg}", "error")
                self.root.after(0, self._ui_error)
                return

            if not venv_exists:
                self.root.after(0, self.log, "Dependances installees.", "ok")

            # Etape 2 : lancer Streamlit
            self.root.after(0, self.log, "Lancement de Streamlit...")
            main_app = self.app_dir / "main.py"
            cmd = build_streamlit_cmd(self.uv_path, main_app)
            self.root.after(0, self.log, f"CMD: {' '.join(cmd)}")

            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=str(self.app_dir),
                env=build_streamlit_env(),
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
            threading.Thread(target=self._read_pipe, daemon=True).start()

            # Attendre que Streamlit soit pret
            for _ in range(STARTUP_TIMEOUT * 2):
                if is_port_in_use(PORT):
                    self.is_running = True
                    self.root.after(0, self.log, "Streamlit pret !", "ok")
                    self.root.after(0, self._ui_running)
                    self.root.after(500, self._open_browser)
                    return
                if self.process.poll() is not None:
                    out, err = self.process.communicate()
                    msg = (err or out or b"").decode("utf-8", errors="replace")
                    self.root.after(0, self.log,
                                    f"Streamlit a plante :\n{msg}", "error")
                    self.root.after(0, self._ui_error)
                    return
                time.sleep(0.5)

            self.root.after(0, self.log, f"Timeout ({STARTUP_TIMEOUT}s)", "error")
            self.root.after(0, self._ui_error)
        except Exception as e:
            self.root.after(0, self.log, f"Erreur : {e}", "error")
            self.root.after(0, self._ui_error)

    def _read_pipe(self) -> None:
        if not self.process or not self.process.stdout:
            return
        for line in self.process.stdout:
            msg = line.decode("utf-8", errors="replace").rstrip()
            if msg:
                self.root.after(0, self.log, msg)

    def _open_browser(self) -> None:
        url = f"http://localhost:{PORT}"
        chrome = find_chrome()
        if chrome:
            subprocess.Popen([chrome, f"--app={url}", "--start-fullscreen"])
            self.log("Chrome lance en mode app", "ok")
        else:
            webbrowser.open(url)

    # ── Cycle de vie ─────────────────────────────────────────────────────────

    def stop_app(self) -> None:
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.process.kill()
        self.root.destroy()

    def on_closing(self) -> None:
        self.stop_app()

    def run(self) -> None:
        self.root.mainloop()

