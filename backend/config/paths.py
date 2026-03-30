import os
from pathlib import Path
import platformdirs

# Racine du projet
APP_ROOT = Path(__file__).parent.parent
APP_NAME = "Gestio"

# Folder paths - Production & Cross Platform
DATA_DIR = platformdirs.user_data_dir(appname=APP_NAME, appauthor=False)

# Database
DB_PATH = os.path.join(DATA_DIR, "finances.db")

# User Desktop folders for active scanning
DESKTOP_DIR = platformdirs.user_desktop_dir()

# Scan directories (Tickets only)
TO_SCAN_DIR = os.path.join(DESKTOP_DIR, "Gestio_Tickets")
SORTED_DIR = os.path.join(DATA_DIR, "tickets_tries")

# Revenue directories
REVENUS_A_TRAITER = os.path.join(DESKTOP_DIR, "Gestio_Revenus")
REVENUS_TRAITES = os.path.join(DATA_DIR, "revenus_traites")

# Application Logs
APP_LOG_PATH = os.path.join(DATA_DIR, "gestio_app.log")

# Objectifs attachments
OBJECTIFS_DIR = os.path.join(DATA_DIR, "objectifs")

# Fichier .env utilisateur (hors dossier d'installation, accessible en écriture)
ENV_PATH = Path(DATA_DIR) / ".env"

# Create directories
for directory in [
    DATA_DIR,
    TO_SCAN_DIR,
    SORTED_DIR,
    REVENUS_A_TRAITER,
    REVENUS_TRAITES,
    OBJECTIFS_DIR,
]:
    os.makedirs(directory, exist_ok=True)
