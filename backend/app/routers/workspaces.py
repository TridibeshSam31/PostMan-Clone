from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

@router.get("", response_model=list[schemas.WorkspaceRead])
def list_workspaces(org_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Workspace)
    if org_id:
        query = query.filter(models.Workspace.organization_id == org_id)
    return query.order_by(models.Workspace.created_at).all()

@router.get("/{workspace_id}", response_model=schemas.WorkspaceRead)
def get_workspace(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.get(models.Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws

@router.post("", response_model=schemas.WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_workspace(body: schemas.WorkspaceCreate, org_id: str | None = None, db: Session = Depends(get_db)):
    # Fallback to first org if none provided
    if not org_id:
        first_org = db.query(models.Organization).first()
        if not first_org:
            raise HTTPException(status_code=400, detail="No organization exists. Create an organization first.")
        org_id = first_org.id
        
    ws = models.Workspace(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        name=body.name,
        type=body.type,
        owner_id="default-user",
        team_id=body.team_id
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws

@router.patch("/{workspace_id}", response_model=schemas.WorkspaceRead)
def update_workspace(workspace_id: str, body: schemas.WorkspaceUpdate, db: Session = Depends(get_db)):
    ws = db.get(models.Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    if body.name is not None:
        ws.name = body.name
    db.commit()
    db.refresh(ws)
    return ws

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.get(models.Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    db.delete(ws)
    db.commit()
