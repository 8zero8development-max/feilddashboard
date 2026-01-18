from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any


class QuoteCreate(BaseModel):
    customer_id: str
    site_id: str
    job_id: Optional[str] = None
    lines: List[Dict[str, Any]]
    notes: Optional[str] = ""
    valid_days: int = 30


class QuoteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    quote_number: str
    customer_id: str
    site_id: str
    job_id: Optional[str]
    lines: List[Dict[str, Any]]
    subtotal: float
    vat: float
    total: float
    status: str
    notes: str
    valid_until: str
    created_at: str


class InvoiceCreate(BaseModel):
    customer_id: str
    site_id: str
    job_id: Optional[str] = None
    quote_id: Optional[str] = None
    lines: List[Dict[str, Any]]
    notes: Optional[str] = ""
    due_days: int = 30


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    invoice_number: str
    customer_id: str
    site_id: str
    job_id: Optional[str]
    quote_id: Optional[str]
    lines: List[Dict[str, Any]]
    subtotal: float
    vat: float
    total: float
    status: str
    notes: str
    due_date: str
    created_at: str


class PartCreate(BaseModel):
    name: str
    part_number: str
    description: Optional[str] = ""
    unit_price: float
    stock_quantity: int = 0
    min_stock_level: int = 5


class PartResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    part_number: str
    description: str
    unit_price: float
    stock_quantity: int
    min_stock_level: int
    created_at: str
