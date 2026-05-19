from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_project = models.Project(
        name=project.name,
        description=project.description,
        created_by=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # Creator becomes Admin automatically
    member = models.ProjectMember(project_id=new_project.id, user_id=current_user.id, role=models.RoleEnum.ADMIN)
    db.add(member)
    db.commit()
    
    return new_project

@router.get("/", response_model=List[schemas.ProjectResponse])
def get_user_projects(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    projects = db.query(models.Project).join(models.ProjectMember).filter(models.ProjectMember.user_id == current_user.id).all()
    return projects

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only admin can delete project
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only project admin can delete this project")
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()

@router.post("/{project_id}/members", response_model=schemas.ProjectMemberResponse)
def add_member(
    project_id: int,
    member_data: schemas.ProjectMemberCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to add members")
        
    user_to_add = db.query(models.User).filter(models.User.id == member_data.user_id).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == member_data.user_id
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="User already in project")
        
    new_member = models.ProjectMember(project_id=project_id, user_id=member_data.user_id, role=member_data.role)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.get("/{project_id}/members", response_model=List[schemas.ProjectMemberResponse])
def get_project_members(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view members")
        
    members = db.query(models.ProjectMember).filter(models.ProjectMember.project_id == project_id).all()
    return members
