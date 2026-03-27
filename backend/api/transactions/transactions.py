from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
from backend.domains.transactions.database.model import Transaction
from backend.domains.transactions.database.repository import TransactionRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
repo = TransactionRepository()


@router.get("/", response_model=List[Transaction])
async def get_transactions():
    try:
        return repo.get_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=int)
async def add_transaction(transaction: Transaction, attachment: Optional[str] = None):
    try:
        if attachment:
            transaction_dict = transaction.model_dump()
            transaction_dict["attachment"] = attachment
            transaction_id = repo.add(transaction_dict)
        else:
            transaction_id = repo.add(transaction)
        return transaction_id
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: int):
    print(f"\n[BACKEND] REQUÊTE DELETE REÇUE POUR ID: {transaction_id}")
    logger.info(f"Requête DELETE reçue pour la transaction {transaction_id}")
    try:
        success = repo.delete(transaction_id)
        if not success:
            print(f"[BACKEND] ÉCHEC : Transaction {transaction_id} non trouvée")
            raise HTTPException(
                status_code=404,
                detail="Transaction non trouvée ou erreur de suppression",
            )
        print(f"[BACKEND] SUCCÈS : Transaction {transaction_id} supprimée")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: int, transaction: Transaction):
    try:
        transaction.id = transaction_id
        transaction_dict = transaction.model_dump()
        success = repo.update(transaction_dict)
        if not success:
            raise HTTPException(status_code=404, detail="Transaction non trouvée")
        return transaction
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
