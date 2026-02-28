import os
from pathlib import Path

# Base directory
_home = Path.home()

# TEST MODE - Switch between production and test databases
TEST_MODE = os.getenv('TEST_MODE', 'false').lower() == 'true'

# Folder paths - Switches based on TEST_MODE
if TEST_MODE:
    DATA_DIR = str(_home / "test")
    print("⚠️ MODE TEST ACTIVÉ - Utilisation de test")
else:
    DATA_DIR = str(_home / "analyse")

# Database
DB_PATH = os.path.join(DATA_DIR, "finances.db")

# Scan directories (Tickets only)
TO_SCAN_DIR = os.path.join(DATA_DIR, "tickets_a_scanner")
SORTED_DIR = os.path.join(DATA_DIR, "tickets_tries")

# Revenue directories
REVENUS_A_TRAITER = os.path.join(DATA_DIR, "revenus_a_traiter")
REVENUS_TRAITES = os.path.join(DATA_DIR, "revenus_traites")

# Application Logs
APP_LOG_DIR = os.path.join(DATA_DIR, "logs")
APP_LOG_PATH = os.path.join(APP_LOG_DIR, "gestio_app.log")

# CSV Export
CSV_EXPORT_DIR = os.path.join(DATA_DIR, "exports")
CSV_TRANSACTIONS_SANS_TICKETS = os.path.join(CSV_EXPORT_DIR, "transactions_sans_tickets.csv")

# Create directories
for directory in [DATA_DIR, TO_SCAN_DIR, SORTED_DIR,
                  REVENUS_A_TRAITER, REVENUS_TRAITES, APP_LOG_DIR, CSV_EXPORT_DIR]:
    os.makedirs(directory, exist_ok=True)
