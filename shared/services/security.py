import hashlib


def hash_iban(iban: str) -> str:
    """
    Hash l'IBAN pour la sécurité tout en gardant un identifiant unique (SHA-256).
    """
    if not iban:
        return "IBAN_INCONNU"
    return hashlib.sha256(iban.replace(" ", "").upper().encode()).hexdigest()
