from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[schemas.HistoryRead])
def list_history(workspace_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.History)
    if workspace_id:
        query = query.filter(models.History.workspace_id == workspace_id)
    return (
        query.order_by(models.History.sent_at.desc())
        .all()
    )


@router.get("/{history_id}", response_model=schemas.HistoryRead)
def get_history_entry(history_id: str, db: Session = Depends(get_db)):
    entry = db.get(models.History, history_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    return entry


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_entry(history_id: str, db: Session = Depends(get_db)):
    entry = db.get(models.History, history_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_history(workspace_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.History)
    if workspace_id:
        query = query.filter(models.History.workspace_id == workspace_id)
    query.delete(synchronize_session=False)
    db.commit()
