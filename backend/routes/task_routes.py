from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to create tasks in this project")
        
    new_task = models.Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/project/{project_id}", response_model=List[schemas.TaskResponse])
def get_project_tasks(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view tasks for this project")
        
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    return tasks

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == db_task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
        
    # Members can only update status. Admins can update anything.
    if membership.role == models.RoleEnum.MEMBER:
        if task_update.status:
            db_task.status = task_update.status
    else:
        update_data = task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_task, key, value)
            
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == db_task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only project admin can delete tasks")
    
    db.delete(db_task)
    db.commit()
