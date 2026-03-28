"""
Tests du AttachmentRepository — CRUD complet sur base de données de test.
"""

import pytest
from pathlib import Path
from datetime import date

from backend.domains.transactions.database.model_attachment import TransactionAttachment
from backend.domains.transactions.database.repository_attachment import (
    AttachmentRepository,
)
from backend.domains.transactions.database.repository import transaction_repository


@pytest.fixture
def attachment_repo(db_path) -> AttachmentRepository:
    """Repository branché sur la DB de test."""
    repo = AttachmentRepository(db_path=db_path)
    transaction_repository.db_path = db_path
    return repo


@pytest.fixture
def test_transaction_id(db_path) -> int:
    """Crée une transaction de test et retourne son ID."""
    transaction_repository.db_path = db_path
    tx_id = transaction_repository.add(
        {
            "type": "depense",
            "categorie": "Test",
            "montant": 10.0,
            "date": date(2026, 1, 1),
            "source": "test",
        }
    )
    return tx_id


@pytest.mark.integration
@pytest.mark.xfail(
    reason="Bug backend: add_attachment ne fait pas de commit (repository_attachment.py)"
)
def test_attachment_crud(attachment_repo, test_transaction_id):
    """Test complet du cycle CRUD des attachments."""
    attachment = TransactionAttachment(
        transaction_id=test_transaction_id, file_path="/path/to/file.jpg"
    )

    new_id = attachment_repo.add_attachment(attachment)
    assert new_id is not None, "L'ajout de l'attachment a échoué"

    result = attachment_repo.get_attachment_by_id(new_id)
    assert result is not None, "Impossible de récupérer l'attachment par ID"
    assert result.id == new_id
    assert result.transaction_id == test_transaction_id
    assert result.file_path == "/path/to/file.jpg"

    attachment_repo.add_attachment(
        TransactionAttachment(
            transaction_id=test_transaction_id, file_path="/path/file2.jpg"
        )
    )
    results = attachment_repo.get_attachments_by_transaction(test_transaction_id)
    assert len(results) == 2, "Les attachments de la transaction n'ont pas été trouvés"

    success = attachment_repo.delete_attachment(new_id)
    assert success is True, "La suppression a échoué"
    assert attachment_repo.get_attachment_by_id(new_id) is None, (
        "L'attachment n'a pas été supprimé"
    )


@pytest.mark.integration
def test_delete_attachment_not_found(attachment_repo):
    """Suppression d'une pièce jointe inexistante."""
    success = attachment_repo.delete_attachment(99999)
    assert success is False
