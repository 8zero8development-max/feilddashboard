from pydantic import BaseModel, ConfigDict
from typing import Optional


class AssetCreate(BaseModel):
    site_id: str
    name: str
    make: Optional[str] = ""
    model: Optional[str] = ""
    serial_number: Optional[str] = ""
    install_date: Optional[str] = ""
    warranty_expiry: Optional[str] = ""
    refrigerant_type: Optional[str] = ""
    refrigerant_charge: Optional[str] = ""
    pm_interval_months: int = 6
    notes: Optional[str] = ""


class AssetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    site_id: str
    name: str
    make: str
    model: str
    serial_number: str
    install_date: str
    warranty_expiry: str
    refrigerant_type: str
    refrigerant_charge: str
    pm_interval_months: int
    last_service_date: Optional[str]
    next_pm_due: Optional[str]
    notes: str
    created_at: str
