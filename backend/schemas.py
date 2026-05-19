from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from .models import PriorityEnum, StatusEnum, RoleEnum

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectMemberCreate(BaseModel):
    user_id: int
    role: RoleEnum = RoleEnum.MEMBER

class ProjectMemberResponse(BaseModel):
    project_id: int
    user_id: int
    role: RoleEnum
    user: UserResponse

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: PriorityEnum = PriorityEnum.MEDIUM
    status: StatusEnum = StatusEnum.TODO
    project_id: int
    assigned_to: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[StatusEnum] = None
    assigned_to: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[date]
    priority: PriorityEnum
    status: StatusEnum
    project_id: int
    assigned_to: Optional[int]
    assignee: Optional[UserResponse]

    class Config:
        from_attributes = True
