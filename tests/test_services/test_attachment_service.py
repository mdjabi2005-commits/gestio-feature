import os
from pathlib import Path
import pytest

from domains.transactions.services.attachment_service import attachment_service
from domains.transactions.database.repository_attachment import attachment_repository

@pytest.fixture
def temp_scanned_dirs(tmp_path: Path, monkeypatch):
    """Détourne les dossiers de l'application vers un dossier temporaire pytest pour les tests."""
    sorted_dir = tmp_path / "tickets_tries"
    revenus_dir = tmp_path / "revenus_traites"
    sorted_dir.mkdir()
    revenus_dir.mkdir()
    
    monkeypatch.setattr("domains.transactions.services.attachment_service.SORTED_DIR", str(sorted_dir))
    monkeypatch.setattr("domains.transactions.services.attachment_service.REVENUS_TRAITES", str(revenus_dir))
    return sorted_dir, revenus_dir

@pytest.fixture
def attachment_svc(db_path, temp_scanned_dirs):
    """Service branché sur une base SQLite temporaire vierge."""
    attachment_repository.db_path = db_path
    # Crée la table pour être sûr
    from domains.transactions.database.schema import init_attachments_table
    init_attachments_table(db_path)
    return attachment_service

def test_add_and_delete_physical_file(attachment_svc, temp_scanned_dirs, tmp_path, transaction_depense):
    """
    Vérifie le cycle complet d'une pièce jointe:
    1. Ajout (déplacement du fichier source et enregistrement BDD)
    2. Suppression (retrait en BDD ET suppression physique vraie sur le disque)
    """
    sorted_dir, revenus_dir = temp_scanned_dirs
    
    # 1. Création d'un faux fichier uploadé
    source_file = tmp_path / "ticket_de_caisse.jpg"
    source_file.write_text("Ceci est un faux ticket pour les tests unitaires")
    
    # --- PRÉREQUIS : UNE TRANSACTION EXISTANTE EN BDD ---
    from domains.transactions.database.repository import transaction_repository
    transaction_repository.db_path = attachment_repository.db_path
    
    from domains.transactions.database.schema import init_transaction_table
    init_transaction_table(attachment_repository.db_path)
    
    tx_id = transaction_repository.add(transaction_depense)
    
    assert tx_id is not None, "Impossible de créer la transaction parente"

    # --- TEST D'AJOUT ---
    success = attachment_svc.add_attachment(
        transaction_id=tx_id,
        file_obj=str(source_file),
        filename="ticket_de_caisse.jpg",
        category="Alimentation",
        transaction_type="Dépense"
    )
    
    assert success is True, "L'ajout de l'attachment a échoué"
    
    # Le fichier source a dû être déplacé (mv)
    assert not source_file.exists(), "Le fichier source original n'a pas été déplacé"
    
    # Le fichier destination doit exister dans son dossier classé
    files_in_sorted = list(sorted_dir.rglob("*.jpg"))
    assert len(files_in_sorted) == 1, "Le fichier classé est introuvable"
    
    moved_file = files_in_sorted[0]
    assert "ticket_de_caisse" in moved_file.name
    assert moved_file.read_text() == "Ceci est un faux ticket pour les tests unitaires"
    
    # La BDD doit contenir une entrée
    df = attachment_repository.get_all_attachments()
    assert len(df) == 1
    
    att_id = int(df.iloc[0]['id'])
    stored_path = df.iloc[0]['file_path']
    assert stored_path == str(moved_file), "Le DB path n'est pas l'absolute path sur le disque"
    
    # --- TEST DE SUPPRESSION ---
    del_success = attachment_svc.delete_attachment(att_id)
    assert del_success is True, "La suppression via le service a échoué"
    
    # La base de données doit être vide
    df_after = attachment_repository.get_all_attachments()
    assert len(df_after) == 0, "L'entrée n'a pas été effacée de la BDD"
    
    # *** CRITIQUE *** : Le fichier physique doit ne plus exister !
    assert not moved_file.exists(), "ERREUR: Le fichier physique subsiste silencieusement sur le disque dur après suppression"
