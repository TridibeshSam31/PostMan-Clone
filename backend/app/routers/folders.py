from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["folders"])


@router.post(
    "/api/collections/{collection_id}/folders",
    response_model=schemas.FolderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_folder(
    collection_id: str,
    body: schemas.FolderCreate,
    db: Session = Depends(get_db),
):
    collection = db.get(models.Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    folder = models.Folder(
        collection_id=collection_id,
        parent_folder_id=body.parent_folder_id,
        name=body.name,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.put("/api/folders/{folder_id}", response_model=schemas.FolderRead)
def update_folder(
    folder_id: str,
    body: schemas.FolderUpdate,
    db: Session = Depends(get_db),
):
    folder = db.get(models.Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    if body.name is not None:
        folder.name = body.name
    if body.parent_folder_id is not None:
        folder.parent_folder_id = body.parent_folder_id

    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/api/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    folder = db.get(models.Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(folder)
    db.commit()
