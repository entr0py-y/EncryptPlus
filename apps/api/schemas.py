from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ScanCreate(BaseModel):
    project_id: Optional[int] = None
    repository_url: Optional[str] = None
    branch: Optional[str] = None
    target_path: Optional[str] = None
    path: Optional[str] = None
    url: Optional[str] = None

class AssetUpdate(BaseModel):
    data_sensitivity: Optional[str] = None
    data_lifetime: Optional[str] = None
    business_criticality: Optional[str] = None
    internet_exposure: Optional[bool] = None
    migration_time: Optional[str] = None

class AgentTaskResponse(BaseModel):
    id: int
    task_id: str
    user_id: str
    task_type: str
    original_prompt: Optional[str] = None
    target_resource: Optional[str] = None
    branch: Optional[str] = None
    scan_id: Optional[int] = None
    status: str
    verification_state: str
    result_summary: Optional[str] = None
    error_info: Optional[str] = None
    retry_count: int
    max_retries: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AgentChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "dev_user"
    session_id: Optional[str] = "default_session"

class AgentChatResponse(BaseModel):
    response: str
    user_id: str
    session_id: str
    task_id: Optional[str] = None
    scan_id: Optional[int] = None
    recalled_memories: List[str] = []
    verified_data: Optional[Dict[str, Any]] = None
    links: List[Dict[str, str]] = []
    status: str = "success"

class UserSignupRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    token: Optional[str] = None
    status: str = "success"
    message: Optional[str] = None

