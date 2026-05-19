from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from .. import models, schemas, database, auth

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/")
def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only get stats for projects the user is part of
    user_project_ids = [
        p.project_id for p in 
        db.query(models.ProjectMember.project_id).filter(models.ProjectMember.user_id == current_user.id).all()
    ]
    
    if not user_project_ids:
        return {
            "total_tasks": 0,
            "tasks_by_status": [],
            "tasks_per_user": [],
            "overdue_tasks": 0
        }

    # Total Tasks
    total_tasks = db.query(models.Task).filter(models.Task.project_id.in_(user_project_ids)).count()
    
    # Tasks by status
    status_counts = db.query(
        models.Task.status, func.count(models.Task.id)
    ).filter(models.Task.project_id.in_(user_project_ids)).group_by(models.Task.status).all()
    
    tasks_by_status = [{"status": s.value, "count": c} for s, c in status_counts]

    # Tasks per user
    user_counts = db.query(
        models.User.name, func.count(models.Task.id)
    ).join(models.Task, models.Task.assigned_to == models.User.id)\
     .filter(models.Task.project_id.in_(user_project_ids))\
     .group_by(models.User.name).all()
     
    tasks_per_user = [{"user": u, "count": c} for u, c in user_counts]
    
    # Overdue tasks
    today = date.today()
    overdue_tasks = db.query(models.Task).filter(
        models.Task.project_id.in_(user_project_ids),
        models.Task.due_date < today,
        models.Task.status != models.StatusEnum.DONE
    ).count()

    return {
        "total_tasks": total_tasks,
        "tasks_by_status": tasks_by_status,
        "tasks_per_user": tasks_per_user,
        "overdue_tasks": overdue_tasks
    }
