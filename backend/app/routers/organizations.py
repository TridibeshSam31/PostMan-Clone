from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("", response_model=list[schemas.OrganizationRead])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(models.Organization).order_by(models.Organization.created_at).all()


@router.get("/{org_id}", response_model=schemas.OrganizationRead)
def get_organization(org_id: str, db: Session = Depends(get_db)):
    org = db.get(models.Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.post("", response_model=schemas.OrganizationRead, status_code=status.HTTP_201_CREATED)
def create_organization(body: schemas.OrganizationCreate, db: Session = Depends(get_db)):
    # Check slug uniqueness
    existing = db.query(models.Organization).filter(models.Organization.slug == body.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Organization slug already exists")

    org = models.Organization(name=body.name, slug=body.slug)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.patch("/{org_id}", response_model=schemas.OrganizationRead)
def update_organization(org_id: str, body: schemas.OrganizationUpdate, db: Session = Depends(get_db)):
    org = db.get(models.Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if body.name is not None:
        org.name = body.name
    if body.slug is not None:
        existing = db.query(models.Organization).filter(
            models.Organization.slug == body.slug,
            models.Organization.id != org_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Organization slug already exists")
        org.slug = body.slug
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(org_id: str, db: Session = Depends(get_db)):
    org = db.get(models.Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    db.delete(org)
    db.commit()
