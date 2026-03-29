### BACKEND STARTUP CLEANED
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
from backend.api.transactions.transactions import router as transactions_router
from backend.api.dashboard.dashboard import router as dashboard_router
from backend.api.attachments.attachments import router as attachments_router
from backend.api.ocr.ocr import router as ocr_router
from backend.api.echeances.echeances import router as echeances_router
from backend.api.budgets.budgets import router as budgets_router
from backend.domains.goals.api.goals import router as goals_router
from backend.domains.transactions.ocr.services.ocr_service import get_ocr_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage : Initialisation de la base de données
    try:
        from backend.domains.transactions.database.schema import (
            init_transaction_table,
            init_attachments_table,
            init_budgets_table,
        )
        from backend.domains.transactions.database.schema_table_echeance import (
            init_echeance_table,
        )
        from backend.domains.goals.database.schema_goal import (
            init_goal_table,
        )

        init_transaction_table()
        init_attachments_table()
        init_budgets_table()
        init_echeance_table()
        init_goal_table()
        logger.info("Base de données initialisée (schema OK) ✅")
    except Exception as e:
        logger.error(f"Erreur initialisation DB : {e}")

    # Initialise le singleton OCR
    try:
        get_ocr_service()
        logger.info("OCR Service pré-initialisé au démarrage du worker ✅")
    except Exception as e:
        logger.error(f"Erreur initialisation OCR au démarrage : {e}")

    # Démarre le watcher de fichiers
    try:
        from backend.api.ocr.watcher import start_watcher

        start_watcher(interval=60)
        logger.info("Watcher de fichiers démarré ✅")
    except Exception as e:
        logger.error(f"Erreur démarrage watcher : {e}")

    yield

    # Arrêt : Nettoyage
    try:
        from backend.api.ocr.watcher import stop_watcher

        stop_watcher()
    except Exception as e:
        logger.error(f"Erreur arrêt watcher : {e}")


app = FastAPI(title="Gestio API", version="4.0.0", lifespan=lifespan)

app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(attachments_router)
app.include_router(ocr_router)
app.include_router(echeances_router)
app.include_router(budgets_router)
app.include_router(goals_router)

# Set up CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8002",
        "http://127.0.0.1:8002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to Gestio API (v4)"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Serve Static Files (Frontend)
frontend_path = os.path.join(os.getcwd(), "frontend", "out")
if os.path.exists(frontend_path):
    # Important: Mount at the end so it doesn't intercept API routes
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    logger.warning(f"Dossier frontend statique non trouvé : {frontend_path}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8002, reload=True)
