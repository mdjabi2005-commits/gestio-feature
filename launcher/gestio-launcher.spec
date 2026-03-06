# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec — Mini-Launcher Gestio (Tkinter only)

Compile UNIQUEMENT launcher.py + Tkinter en un petit EXE (~5-10 Mo).
Streamlit, pandas, onnxruntime etc. sont geres par uv dans le venv.

Lancer depuis la RACINE du projet :
  pyinstaller launcher/gestio-launcher.spec --noconfirm
"""
import sys
from pathlib import Path

ROOT = Path(SPECPATH)  # dossier launcher/

a = Analysis(
    [str(ROOT / 'launcher.py')],
    pathex=[str(ROOT), str(ROOT.parent)],  # launcher/ + racine projet
    binaries=[],
    datas=[],
    hiddenimports=[
        'tkinter',
        'tkinter.scrolledtext',
        'launcher.launcher_core',
        'launcher.launcher_ui',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'streamlit', 'pandas', 'numpy', 'plotly', 'matplotlib',
        'PIL', 'cv2', 'onnxruntime', 'rapidocr_onnxruntime',
        'pdfminer', 'pydantic', 'requests', 'cryptography',
        'altair', 'psutil', 'ollama', 'groq',
        'pytest', 'unittest', 'doctest', 'IPython', 'jupyter',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='GestioLauncher',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=['vcruntime140.dll', 'python*.dll'],
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(ROOT.parent / 'resources' / 'icons' / 'logo.ico') if sys.platform == 'win32' else None,
)
