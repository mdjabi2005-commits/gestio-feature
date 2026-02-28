"""
Configuration du système de logging pour Gestion Financière V4

Ce module configure le logging avec:
- Rotation automatique des fichiers (5MB max)
- Logs dans fichier + console
- Niveaux de log configurables
- **Gestion des erreurs avec Trace ID**: Console (résumé) vs Fichier (stack trace complet)
"""

import logging
import logging.handlers
import sys
import uuid
from pathlib import Path

from config.paths import APP_LOG_PATH


class TraceIdFilter(logging.Filter):
    """
    Filtre personnalisé pour injecter un 'trace_id' dans chaque record de log.
    
    Utilité : 
    Permet de corréler les logs entre la console et le fichier. 
    L'ID est généré lors des erreurs (via log_error) et propagé.
    """

    def filter(self, record):
        if not hasattr(record, 'trace_id'):
            record.trace_id = 'N/A'
        return True


class NoStacktraceFilter(logging.Filter):
    """
    Filtre pour supprimer la stacktrace (trace d'erreur complète) des logs.
    
    Utilité :
    Utilisé pour le Handler Console afin de garder la sortie propre et lisible.
    Les stacktraces complètes sont conservées uniquement dans le fichier de log.
    """

    def filter(self, record):
        record.exc_info = None
        record.exc_text = None
        record.stack_info = None
        return True


def setup_logging(level: str = "INFO") -> None:
    """
    Configure le système de logging pour l'application.
    """

    log_file = Path(APP_LOG_PATH)

    # === FORMATTERS ===
    # Fichier: Complet avec Stack Trace (si exc_info est True, logging le gère) + Trace ID
    file_formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - [TraceID: %(trace_id)s] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console: Épuré, SANS stack trace automatique (grâce au NoStacktraceFilter)
    console_formatter = logging.Formatter(
        fmt='%(asctime)s - %(levelname)s - [TraceID: %(trace_id)s] - %(message)s',
        datefmt='%H:%M:%S'
    )

    # === HANDLERS ===

    # 1. Handler fichier (Rotation 5MB)
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=3,
        encoding='utf-8'
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(logging.INFO)
    file_handler.addFilter(TraceIdFilter())

    # 2. Handler console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)  # On veut voir les INFOs de succès aussi
    console_handler.addFilter(TraceIdFilter())
    console_handler.addFilter(NoStacktraceFilter())  # <--- Supprime les stack traces en console

    # === ROOT LOGGER ===
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))

    # Nettoyer et réassigner
    root_logger.handlers.clear()
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # Log de démarrage
    root_logger.info("=" * 50, extra={'trace_id': 'INIT'})
    root_logger.info("Logging system initialized", extra={'trace_id': 'INIT'})
    root_logger.info(f"Log file: {log_file}", extra={'trace_id': 'INIT'})
    root_logger.info(f"Log level: {level}", extra={'trace_id': 'INIT'})
    root_logger.info("=" * 50, extra={'trace_id': 'INIT'})


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def log_error(exception: Exception, message: str = "Une erreur est survenue") -> str:
    """
    Log une erreur avec un ID de traçabilité (Trace ID).
    
    - Console: Affiche le message + le Trace ID (PAS de stack trace).
    - Fichier: Affiche le message + le Trace ID + le Stack Trace COMPLET.
    
    Returns:
        str: Le Trace ID généré (pour affichage UI éventuel)
    """
    trace_id = str(uuid.uuid4())[:8]  # ID court (8 chars)
    logger = logging.getLogger("ErrorManager")

    # Log Fichier: complet avec exc_info=True pour avoir la stack trace
    # Log Console: filtré par NoStacktraceFilter pour cacher la stack trace
    logger.error(
        f"{message} (Voir log fichier pour détails)",
        exc_info=exception,
        extra={'trace_id': trace_id}
    )

    return trace_id
