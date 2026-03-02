"""
Tests multi-cœur du module OCR — Issue #3
Vérifie la stabilité et la cohérence de l'initialisation et de l'exécution
de plusieurs instances RapidOCR en parallèle (threads et processus).
"""

import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
from pathlib import Path

import pytest
from PIL import Image, ImageDraw

from domains.transactions.ocr.core.hardware_utils import get_optimal_workers

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _create_ticket_image(path: Path, text_lines: list[str] | None = None) -> str:
    """Crée une image synthétique de ticket pour les tests OCR."""
    if text_lines is None:
        text_lines = ["TOTAL : 42.50", "Date: 15/01/2026"]
    img = Image.new("RGB", (400, 50 + 50 * len(text_lines)), color="white")
    draw = ImageDraw.Draw(img)
    for i, line in enumerate(text_lines):
        draw.text((50, 30 + 50 * i), line, fill="black")
    img.save(str(path))
    return str(path)


def _init_engine_in_worker(worker_id: int) -> tuple[int, float]:
    """Initialise un moteur RapidOCR et retourne (id, durée)."""
    from rapidocr_onnxruntime import RapidOCR

    t0 = time.time()
    RapidOCR()
    return worker_id, time.time() - t0


def _extract_text_in_worker(args: tuple[int, str]) -> tuple[int, list[str], float]:
    """Exécute l'OCR dans un worker et retourne (id, lignes, durée)."""
    worker_id, image_path = args
    from rapidocr_onnxruntime import RapidOCR

    engine = RapidOCR()
    t0 = time.time()
    result, _ = engine(image_path)
    elapsed = time.time() - t0
    lines = [r[1] for r in result] if result else []
    return worker_id, lines, elapsed


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def ticket_image(tmp_path: Path) -> str:
    """Image synthétique de ticket utilisée par les tests OCR."""
    return _create_ticket_image(tmp_path / "ticket.png")


@pytest.fixture
def ticket_images_batch(tmp_path: Path) -> list[str]:
    """Lot de 8 images synthétiques identiques pour les tests par lot."""
    paths: list[str] = []
    for i in range(8):
        p = _create_ticket_image(
            tmp_path / f"ticket_{i}.png",
            text_lines=[f"TOTAL : {10.0 + i:.2f}", "Date: 01/02/2026"],
        )
        paths.append(p)
    return paths


# ─────────────────────────────────────────────────────────────────────────────
# Tests : initialisation multi-cœur
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.ocr
class TestMultiCoreInit:
    """Vérifie que plusieurs moteurs RapidOCR peuvent être initialisés en parallèle."""

    def test_init_multi_thread(self) -> None:
        """Initialise N moteurs en threads et vérifie qu'aucun ne plante."""
        n_workers = min(4, os.cpu_count() or 1)
        results: list[tuple[int, float]] = []

        with ThreadPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_init_engine_in_worker, i) for i in range(n_workers)]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == n_workers
        for wid, elapsed in results:
            assert elapsed < 30, f"Worker {wid} a mis trop de temps à s'initialiser ({elapsed:.1f}s)"
        logger.info("ThreadPool init OK — %d workers en %.3fs max", n_workers, max(e for _, e in results))

    def test_init_multi_process(self) -> None:
        """Initialise N moteurs dans des processus séparés."""
        n_workers = min(4, os.cpu_count() or 1)
        results: list[tuple[int, float]] = []

        with ProcessPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_init_engine_in_worker, i) for i in range(n_workers)]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == n_workers
        for wid, elapsed in results:
            assert elapsed < 30, f"Process {wid} a mis trop de temps ({elapsed:.1f}s)"
        logger.info("ProcessPool init OK — %d workers en %.3fs max", n_workers, max(e for _, e in results))

    def test_init_single_vs_multi_thread_stability(self) -> None:
        """L'init séquentielle et parallèle produisent le même nombre de moteurs sans erreur."""
        from rapidocr_onnxruntime import RapidOCR

        # Séquentiel
        engines_seq = [RapidOCR() for _ in range(3)]

        # Parallèle
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = [pool.submit(_init_engine_in_worker, i) for i in range(3)]
            results = [f.result() for f in as_completed(futures)]

        assert len(engines_seq) == 3
        assert len(results) == 3


# ─────────────────────────────────────────────────────────────────────────────
# Tests : extraction OCR parallèle
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.ocr
class TestMultiCoreExtraction:
    """Vérifie la cohérence des résultats OCR en extraction parallèle."""

    def test_thread_extraction_coherence(self, ticket_image: str) -> None:
        """Toutes les extractions thread doivent retourner le même texte."""
        n_workers = min(4, os.cpu_count() or 1)
        results: list[tuple[int, list[str], float]] = []

        with ThreadPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_extract_text_in_worker, (i, ticket_image)) for i in range(n_workers)]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == n_workers
        # Chaque worker doit retourner le même texte
        first_lines = sorted(results[0][1])
        for wid, lines, _ in results:
            assert sorted(lines) == first_lines, f"Worker {wid} a retourné un texte différent"

    def test_process_extraction_coherence(self, ticket_image: str) -> None:
        """Toutes les extractions process doivent retourner le même texte."""
        n_workers = min(4, os.cpu_count() or 1)
        results: list[tuple[int, list[str], float]] = []

        with ProcessPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_extract_text_in_worker, (i, ticket_image)) for i in range(n_workers)]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == n_workers
        first_lines = sorted(results[0][1])
        for wid, lines, _ in results:
            assert sorted(lines) == first_lines, f"Process {wid} a retourné un texte différent"

    def test_batch_thread_extraction(self, ticket_images_batch: list[str]) -> None:
        """Traitement d'un lot d'images en thread pool — chaque image produit un résultat."""
        n_workers = min(4, os.cpu_count() or 1)
        args = [(i, p) for i, p in enumerate(ticket_images_batch)]
        results: list[tuple[int, list[str], float]] = []

        with ThreadPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_extract_text_in_worker, a) for a in args]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == len(ticket_images_batch)
        for wid, lines, _ in results:
            assert len(lines) >= 1, f"Worker {wid} n'a retourné aucun texte"

    def test_batch_process_extraction(self, ticket_images_batch: list[str]) -> None:
        """Traitement d'un lot d'images en process pool — chaque image produit un résultat."""
        n_workers = min(4, os.cpu_count() or 1)
        args = [(i, p) for i, p in enumerate(ticket_images_batch)]
        results: list[tuple[int, list[str], float]] = []

        with ProcessPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_extract_text_in_worker, a) for a in args]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == len(ticket_images_batch)
        for wid, lines, _ in results:
            assert len(lines) >= 1, f"Process {wid} n'a retourné aucun texte"


# ─────────────────────────────────────────────────────────────────────────────
# Tests : intégration hardware_utils + multi-cœur
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.ocr
class TestOptimalWorkersIntegration:
    """Vérifie que get_optimal_workers dimensionne correctement le pool multi-cœur."""

    def test_optimal_workers_thread_init(self) -> None:
        """Initialise exactement get_optimal_workers(8) moteurs en threads."""
        n_workers = get_optimal_workers(8)
        results: list[tuple[int, float]] = []

        with ThreadPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_init_engine_in_worker, i) for i in range(n_workers)]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == n_workers
        logger.info("Optimal workers=%d — init OK", n_workers)

    def test_optimal_workers_process_extraction(self, ticket_images_batch: list[str]) -> None:
        """Utilise get_optimal_workers pour dimensionner un ProcessPool d'extraction."""
        n_workers = get_optimal_workers(len(ticket_images_batch))
        args = [(i, p) for i, p in enumerate(ticket_images_batch)]
        results: list[tuple[int, list[str], float]] = []

        with ProcessPoolExecutor(max_workers=n_workers) as pool:
            futures = [pool.submit(_extract_text_in_worker, a) for a in args]
            for f in as_completed(futures):
                results.append(f.result())

        assert len(results) == len(ticket_images_batch)
        for wid, lines, _ in results:
            assert len(lines) >= 1
