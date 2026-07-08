from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/environments", tags=["environments"])


@router.get("", response_model=list[schemas.EnvironmentRead])
def list_environments(workspace_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Environment)
    if workspace_id:
        query = query.filter(models.Environment.workspace_id == workspace_id)
    return query.order_by(models.Environment.created_at).all()


@router.post("", response_model=schemas.EnvironmentRead, status_code=status.HTTP_201_CREATED)
def create_environment(body: schemas.EnvironmentCreate, workspace_id: str | None = None, db: Session = Depends(get_db)):
    if not workspace_id:
        ws = db.query(models.Workspace).first()
        if not ws:
            raise HTTPException(status_code=400, detail="Create a workspace first.")
        workspace_id = ws.id
    else:
        ws = db.get(models.Workspace, workspace_id)
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")

    env = models.Environment(
        id=str(uuid.uuid4()),
        name=body.name,
        workspace_id=workspace_id
    )
    db.add(env)
    db.commit()
    db.refresh(env)
    return env


@router.patch("/{env_id}", response_model=schemas.EnvironmentRead)
def rename_environment(
    env_id: str, body: schemas.EnvironmentUpdate, db: Session = Depends(get_db)
):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    env.name = body.name
    db.commit()
    db.refresh(env)
    return env


@router.delete("/{env_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_environment(env_id: str, db: Session = Depends(get_db)):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(env)
    db.commit()


@router.get("/{env_id}/variables", response_model=list[schemas.EnvironmentVariableRead])
def get_variables(env_id: str, db: Session = Depends(get_db)):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env.variables


@router.put("/{env_id}/variables", response_model=list[schemas.EnvironmentVariableRead])
def replace_variables(
    env_id: str,
    body: list[schemas.EnvironmentVariableCreate],
    db: Session = Depends(get_db),
):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    db.query(models.EnvironmentVariable).filter(
        models.EnvironmentVariable.environment_id == env_id
    ).delete()

    new_vars = [
        models.EnvironmentVariable(
            id=str(uuid.uuid4()),
            environment_id=env_id,
            key=v.key,
            value=v.value,
            enabled=v.enabled,
        )
        for v in body
    ]
    db.add_all(new_vars)
    db.commit()

    return (
        db.query(models.EnvironmentVariable)
        .filter(models.EnvironmentVariable.environment_id == env_id)
        .all()
    )


@router.patch("/{env_id}/activate", response_model=schemas.EnvironmentRead)
def activate_environment(env_id: str, db: Session = Depends(get_db)):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    # Set all environments in the SAME workspace to inactive first
    db.query(models.Environment).filter(
        models.Environment.workspace_id == env.workspace_id
    ).update({models.Environment.is_active: False})

    # Activate the chosen one
    env.is_active = True
    db.commit()
    db.refresh(env)
    return env
