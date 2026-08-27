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
