# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file — Gestio V4
Mode : onedir (requis pour Inno Setup et AppImage)
"""
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, copy_metadata

# ── Dépendances de métadonnées requises par Streamlit ─────────────────────────
METADATA = (
    copy_metadata('streamlit')
    + copy_metadata('altair')
    + copy_metadata('pandas')
    + copy_metadata('pydantic')
    + copy_metadata('plotly')
    + copy_metadata('rapidocr_onnxruntime')
)

# ── Données statiques à embarquer ─────────────────────────────────────────────
DATAS = (
    [
        ('main.py',    '.'),
        ('resources',  'resources'),
        ('config',     'config'),
        ('domains',    'domains'),
        ('shared',     'shared'),
    ]
    + collect_data_files('streamlit')
    + collect_data_files('altair')
    + collect_data_files('rapidocr_onnxruntime')
    + METADATA
)

# ── Imports cachés ─────────────────────────────────────────────────────────────
HIDDEN = [
    # Streamlit internals
    'streamlit',
    'streamlit.runtime.scriptrunner.magic_funcs',
    'streamlit.web.cli',
    'streamlit.components.v1',
    # Data
    'pandas', 'numpy', 'plotly', 'plotly.express',
    'matplotlib', 'matplotlib.backends.backend_agg',
    # Image / OCR
    'PIL', 'PIL.Image', 'cv2',
    'rapidocr_onnxruntime',
    # PDF / YAML
    'pdfminer', 'pdfminer.high_level', 'yaml',
    # DB & Sécurité
    'sqlite3', 'cryptography', 'cryptography.fernet',
    'pyjwt',
    # Utils
    'psutil', 'pydantic', 'requests',
    'dateutil', 'dateutil.parser',
    # LLM local
    'ollama',
    # Concurrence (Pilier 1 roadmap)
    'multiprocessing', 'concurrent.futures',
    # UI
    'tkinter', 'tkinter.scrolledtext',
]

a = Analysis(
    ['launcher.py'],
    pathex=[],
    binaries=[],
    datas=DATAS,
    hiddenimports=HIDDEN,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'pytest', 'unittest', 'doctest',   # Pas de tooling de test en prod
        'IPython', 'jupyter',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,          # ← onedir : les binaires vont dans COLLECT
    name='GestioV4',
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
    icon='resources/icons/gestio.ico' if sys.platform == 'win32' else (
         'resources/icons/gestio.icns' if sys.platform == 'darwin' else None
    ),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=['vcruntime140.dll', 'python*.dll'],
    name='GestioV4',
)

# macOS : génère un .app bundle
if sys.platform == 'darwin':
    app = BUNDLE(
        coll,
        name='Gestio.app',
        icon='resources/icons/gestio.icns',
        bundle_identifier='com.gestio.app',
        info_plist={
            'CFBundleShortVersionString': '4.0',
            'CFBundleVersion': '4.0.0',
            'NSHighResolutionCapable': True,
            'LSMinimumSystemVersion': '11.0',
        },
    )
