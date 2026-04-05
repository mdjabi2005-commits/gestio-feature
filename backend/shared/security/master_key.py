"""
Gestion de la clé maître (Master Key) pour SQLCipher.

Génère automatiquement une clé unique par installation et la stocke
dans le fichier .env du répertoire de données utilisateur.
"""

import logging
import os
import secrets
from pathlib import Path

logger = logging.getLogger(__name__)

KEY_LENGTH = 64  # 64 caractères hex = 256 bits de sécurité


def generer_cle_maitre() -> str:
    """
    Génère une clé maître cryptographiquement sécurisée.

    Returns:
        Chaîne hexadécimale de KEY_LENGTH caractères.
    """
    return secrets.token_hex(KEY_LENGTH // 2)


def initialiser_cle_maitre(env_path: Path) -> str:
    """
    Vérifie si une MASTER_KEY existe dans le fichier .env.
    Si elle n'existe pas, en génère une automatiquement et l'écrit.

    Args:
        env_path: Chemin vers le fichier .env

    Returns:
        La clé maître (existante ou nouvellement générée).
    """
    # Vérifier si le fichier .env existe et contient déjà une MASTER_KEY
    if env_path.exists():
        contenu = env_path.read_text(encoding="utf-8")
        for ligne in contenu.splitlines():
            ligne_stripped = ligne.strip()
            if ligne_stripped.startswith("MASTER_KEY=") and not ligne_stripped.startswith("#"):
                cle = ligne_stripped.split("=", 1)[1].strip().strip("'\"")
                if cle:
                    logger.info("Clé maître trouvée dans %s", env_path)
                    return cle

    # Pas de clé trouvée → en générer une
    nouvelle_cle = generer_cle_maitre()

    # Créer le répertoire parent si nécessaire
    env_path.parent.mkdir(parents=True, exist_ok=True)

    # Ajouter la clé au fichier .env (créer ou compléter)
    mode = "a" if env_path.exists() else "w"
    with open(env_path, mode, encoding="utf-8") as f:
        if mode == "a":
            f.write("\n")
        f.write(f"# Clé de chiffrement SQLCipher — générée automatiquement\n")
        f.write(f"# NE JAMAIS partager ou supprimer cette clé !\n")
        f.write(f"MASTER_KEY={nouvelle_cle}\n")

    logger.info("Nouvelle clé maître générée et sauvegardée dans %s", env_path)
    return nouvelle_cle
