import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.get("", response_model=list[schemas.CollectionRead])
def list_collections(workspace_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Collection)
    if workspace_id:
        query = query.filter(models.Collection.workspace_id == workspace_id)
    return query.order_by(models.Collection.created_at).all()


@router.post("", response_model=schemas.CollectionRead, status_code=status.HTTP_201_CREATED)
def create_collection(body: schemas.CollectionCreate, workspace_id: str | None = None, db: Session = Depends(get_db)):
    if not workspace_id:
        # Fallback to the first workspace in database
        ws = db.query(models.Workspace).first()
        if not ws:
            raise HTTPException(status_code=400, detail="Create a workspace first.")
        workspace_id = ws.id
    else:
        ws = db.get(models.Workspace, workspace_id)
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")

    collection = models.Collection(
        name=body.name,
        description=body.description,
        workspace_id=workspace_id
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


@router.patch("/{collection_id}", response_model=schemas.CollectionRead)
def rename_collection(
    collection_id: str,
    body: schemas.CollectionUpdate,
    db: Session = Depends(get_db),
):
    collection = db.get(models.Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if body.name is not None:
        collection.name = body.name
    if body.description is not None:
        collection.description = body.description
    db.commit()
    db.refresh(collection)
    return collection


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(collection_id: str, db: Session = Depends(get_db)):
    collection = db.get(models.Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    db.delete(collection)
    db.commit()
