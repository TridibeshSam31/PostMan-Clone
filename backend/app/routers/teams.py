from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/organizations/{org_id}/teams", tags=["teams"])

@router.get("", response_model=list[schemas.TeamRead])
def list_teams(org_id: str, db: Session = Depends(get_db)):
    org = db.get(models.Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return db.query(models.Team).filter(models.Team.organization_id == org_id).all()

@router.post("", response_model=schemas.TeamRead, status_code=status.HTTP_201_CREATED)
def create_team(org_id: str, body: schemas.TeamCreate, db: Session = Depends(get_db)):
    org = db.get(models.Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    team = models.Team(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        name=body.name,
        description=body.description
    )
    db.add(team)
    
    # Auto-add default-user as admin of the team for convenience
    default_member = models.TeamMember(
        id=str(uuid.uuid4()),
        team_id=team.id,
        user_id="default-user",
        role="admin"
    )
    db.add(default_member)
    
    db.commit()
    db.refresh(team)
    return team

@router.patch("/{team_id}", response_model=schemas.TeamRead)
def update_team(org_id: str, team_id: str, body: schemas.TeamUpdate, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(
        models.Team.id == team_id,
        models.Team.organization_id == org_id
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found in this organization")
    
    if body.name is not None:
        team.name = body.name
    if body.description is not None:
        team.description = body.description
        
    db.commit()
    db.refresh(team)
    return team

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(org_id: str, team_id: str, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(
        models.Team.id == team_id,
        models.Team.organization_id == org_id
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found in this organization")
    db.delete(team)
    db.commit()

@router.post("/{team_id}/members", response_model=schemas.TeamMemberRead, status_code=status.HTTP_201_CREATED)
def add_team_member(org_id: str, team_id: str, body: schemas.TeamMemberAdd, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(
        models.Team.id == team_id,
        models.Team.organization_id == org_id
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    user = db.get(models.User, body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if already a member
    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == body.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this team")
        
    member = models.TeamMember(
        id=str(uuid.uuid4()),
        team_id=team_id,
        user_id=body.user_id,
        role=body.role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member

@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(org_id: str, team_id: str, user_id: str, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(
        models.Team.id == team_id,
        models.Team.organization_id == org_id
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this team")
        
    db.delete(member)
    db.commit()
