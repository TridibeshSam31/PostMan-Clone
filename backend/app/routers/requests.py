import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["requests"])


@router.post(
    "/api/collections/{collection_id}/requests",
    response_model=schemas.RequestRead,
    status_code=status.HTTP_201_CREATED,
)
def create_request(
    collection_id: str,
    body: schemas.RequestCreate,
    db: Session = Depends(get_db),
):
    collection = db.get(models.Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    req = models.Request(
        collection_id=collection_id,
        folder_id=body.folder_id,
        name=body.name,
        method=body.method,
        url=body.url,
        headers=json.dumps([kv.model_dump() for kv in body.headers]),
        params=json.dumps([kv.model_dump() for kv in body.params]),
        body_type=body.body_type,
        body_raw_type=body.body_raw_type,
        body_content=body.body_content,
        auth_type=body.auth_type,
        auth_config=json.dumps(body.auth_config),
        order_index=body.order_index,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/api/requests/{request_id}", response_model=schemas.RequestRead)
def get_request(request_id: str, db: Session = Depends(get_db)):
    req = db.get(models.Request, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.put("/api/requests/{request_id}", response_model=schemas.RequestRead)
def update_request(
    request_id: str,
    body: schemas.RequestUpdate,
    db: Session = Depends(get_db),
):
    req = db.get(models.Request, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if body.name is not None:
        req.name = body.name
    if body.method is not None:
        req.method = body.method
    if body.url is not None:
        req.url = body.url
    if body.headers is not None:
        req.headers = json.dumps([kv.model_dump() for kv in body.headers])
    if body.params is not None:
        req.params = json.dumps([kv.model_dump() for kv in body.params])
    if body.body_type is not None:
        req.body_type = body.body_type
    if body.body_raw_type is not None:
        req.body_raw_type = body.body_raw_type
    if body.body_content is not None:
        req.body_content = body.body_content
    if body.auth_type is not None:
        req.auth_type = body.auth_type
    if body.auth_config is not None:
        req.auth_config = json.dumps(body.auth_config)
    if body.folder_id is not None:
        req.folder_id = body.folder_id
    if body.order_index is not None:
        req.order_index = body.order_index

    db.commit()
    db.refresh(req)
    return req


@router.delete("/api/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(request_id: str, db: Session = Depends(get_db)):
    req = db.get(models.Request, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(req)
    db.commit()
