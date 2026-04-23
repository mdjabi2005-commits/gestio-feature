import os
from pathlib import Path
import platformdirs
from dotenv import load_dotenv

APP_ROOT = Path(__file__).parent.parent.parent
APP_NAME = "gestio-test"

DATA_DIR = Path(platformdirs.user_data_dir(appname=APP_NAME, appauthor=False))

DB_PATH = DATA_DIR / "finances.db"

DESKTOP_DIR = Path(platformdirs.user_desktop_dir())

TO_SCAN_DIR = DESKTOP_DIR / "Gestio_Tickets"
SORTED_DIR = DATA_DIR / "tickets_tries"

REVENUS_A_TRAITER = DESKTOP_DIR / "Gestio_Revenus"
REVENUS_TRAITES = DATA_DIR / "revenus_traites"

APP_LOG_PATH = DATA_DIR / "gestio_app.log"

OBJECTIFS_DIR = DATA_DIR / "objectifs"

ENV_PATH = DATA_DIR / ".env"
if not ENV_PATH.exists():
    PROJECT_ENV = APP_ROOT / ".env"
    if PROJECT_ENV.exists():
        ENV_PATH = PROJECT_ENV

# Générer automatiquement la clé maître si elle n'existe pas
from backend.shared.utils.master_key import initialiser_cle_maitre

_cle_generee = initialiser_cle_maitre(ENV_PATH)

# Recharger le .env après éventuelle génération
load_dotenv(ENV_PATH, override=True)

MASTER_KEY = os.getenv("MASTER_KEY", _cle_generee)

for directory in [
    DATA_DIR,
    TO_SCAN_DIR,
    SORTED_DIR,
    REVENUS_A_TRAITER,
    REVENUS_TRAITES,
    OBJECTIFS_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)

