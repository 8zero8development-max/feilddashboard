from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any


class JobCreate(BaseModel):
    customer_id: str
    site_id: str
    asset_ids: List[str] = []
    job_type: str
    priority: str = "medium"
    description: str
    assigned_engineer_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    estimated_duration: int = 60
    sla_hours: Optional[int] = None


class JobUpdate(BaseModel):
    status: Optional[str] = None
    assigned_engineer_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None


class JobResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    job_number: str
    customer_id: str
    site_id: str
    asset_ids: List[str]
    job_type: str
    priority: str
    status: str
    description: str
    assigned_engineer_id: Optional[str]
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    estimated_duration: int
    sla_hours: Optional[int]
    created_at: str
    updated_at: str


class ChecklistItemCreate(BaseModel):
    job_id: str
    description: str
    completed: bool = False
    notes: Optional[str] = ""


class JobCompletionCreate(BaseModel):
    job_id: str
    engineer_notes: str
    parts_used: List[Dict[str, Any]] = []
    travel_time: int = 0
    time_on_site: int = 0
    customer_signature: Optional[str] = None
    checklist_items: List[Dict[str, Any]] = []
    photos: List[str] = []
