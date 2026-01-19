from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any


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
    fgas_category: Optional[str] = ""
    fgas_co2_equivalent: Optional[float] = None
    fgas_certified_technician: Optional[str] = ""
    fgas_leak_check_interval: int = 12
    fgas_notes: Optional[str] = ""


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
    fgas_category: Optional[str] = ""
    fgas_co2_equivalent: Optional[float] = None
    fgas_certified_technician: Optional[str] = ""
    fgas_leak_check_interval: Optional[int] = 12
    fgas_last_leak_check: Optional[str] = None
    fgas_next_leak_check_due: Optional[str] = None
    fgas_notes: Optional[str] = ""


class FGasLogCreate(BaseModel):
    asset_id: str
    job_id: Optional[str] = None
    log_type: str
    refrigerant_added: Optional[float] = None
    refrigerant_recovered: Optional[float] = None
    refrigerant_lost: Optional[float] = None
    technician_certification: Optional[str] = ""
    leak_test_result: Optional[str] = ""
    test_pressure: Optional[float] = None
    test_method: Optional[str] = ""
    notes: Optional[str] = ""


class FGasLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    asset_id: str
    job_id: Optional[str]
    log_type: str
    refrigerant_added: Optional[float]
    refrigerant_recovered: Optional[float]
    refrigerant_lost: Optional[float]
    technician_certification: Optional[str]
    leak_test_result: Optional[str]
    test_pressure: Optional[float]
    test_method: Optional[str]
    notes: Optional[str]
    created_at: str
