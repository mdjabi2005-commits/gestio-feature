"""
File utilities - Gestion des fichiers temporaires et uploads.
"""

import os
import shutil
from contextlib import contextmanager
from typing import Generator, Optional
from fastapi import UploadFile


SUPPORTED_IMAGE_FORMATS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
SUPPORTED_PDF_FORMATS = {".pdf"}


def validate_image_format(filename: str) -> bool:
    """Vérifie si le format d'image est supporté."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in SUPPORTED_IMAGE_FORMATS


def validate_pdf_format(filename: str) -> bool:
    """Vérifie si le format PDF est supporté."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in SUPPORTED_PDF_FORMATS


def get_file_extension(filename: str) -> str:
    """Retourne l'extension du fichier en lowercase."""
    return os.path.splitext(filename)[1].lower()


@contextmanager
def temp_file_context(
    filename: str, prefix: str = "tmp_"
) -> Generator[str, None, None]:
    """
    Context manager pour gérer automatiquement un fichier temporaire.
    Le fichier est supprimé à la fin du bloc.

    Usage:
        with temp_file_context("ticket.jpg", "ocr_") as path:
            # work with path
            pass
        # path is automatically deleted
    """
    ext = os.path.splitext(filename)[1]
    temp_path = f"{prefix}{os.urandom(8).hex()}{ext}"
    try:
        yield temp_path
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


async def save_upload_to_temp(upload_file: UploadFile, prefix: str = "tmp_") -> str:
    """
    Sauvegarde un fichier uploadé dans un fichier temporaire.

    Args:
        upload_file: Fichier FastAPI UploadFile
        prefix: Préfixe pour le nom du fichier temporaire

    Returns:
        Chemin vers le fichier temporaire créé
    """
    ext = os.path.splitext(upload_file.filename)[1]
    temp_path = f"{prefix}{os.urandom(8).hex()}{ext}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return temp_path


def cleanup_temp_files(paths: list[str]) -> None:
    """
    Supprime une liste de fichiers temporaires.

    Args:
        paths: Liste de chemins de fichiers à supprimer
    """
    for path in paths:
        if os.path.exists(path):
            os.remove(path)


class TempFileManager:
    """Gestionnaire de fichiers temporaires multiples."""

    def __init__(self):
        self._paths: list[str] = []

    def add(self, path: str) -> None:
        """Ajoute un chemin à la liste de nettoyage."""
        self._paths.append(path)

    async def save_upload(self, upload_file: UploadFile, prefix: str = "tmp_") -> str:
        """Sauvegarde et ajoute à la liste de nettoyage."""
        path = await save_upload_to_temp(upload_file, prefix)
        self.add(path)
        return path

    def cleanup(self) -> None:
        """Supprime tous les fichiers gérés."""
        cleanup_temp_files(self._paths)
        self._paths.clear()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()
        return False
