from pydantic import BaseModel, ConfigDict
from typing import Optional


class CustomerCreate(BaseModel):
    company_name: str
    billing_address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    notes: Optional[str] = ""


class CustomerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_name: str
    billing_address: str
    phone: str
    email: str
    notes: str
    created_at: str


class SiteCreate(BaseModel):
    customer_id: str
    name: str
    address: str
    access_notes: Optional[str] = ""
    key_location: Optional[str] = ""
    opening_hours: Optional[str] = ""
    contact_name: Optional[str] = ""
    contact_phone: Optional[str] = ""


class SiteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    customer_id: str
    name: str
    address: str
    access_notes: str
    key_location: str
    opening_hours: str
    contact_name: str
    contact_phone: str
    created_at: str
