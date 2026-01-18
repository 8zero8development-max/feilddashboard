from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
import base64
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'craven-cooling-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# File storage directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Craven Cooling Services FSM")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== Pydantic Models ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "engineer"  # admin, dispatcher, engineer

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    created_at: str

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

class JobCreate(BaseModel):
    customer_id: str
    site_id: str
    asset_ids: List[str] = []
    job_type: str  # breakdown, pm_service, install, quote_visit
    priority: str = "medium"  # low, medium, high, urgent
    description: str
    assigned_engineer_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    estimated_duration: int = 60  # minutes
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
    travel_time: int = 0  # minutes
    time_on_site: int = 0  # minutes
    customer_signature: Optional[str] = None  # base64 encoded
    checklist_items: List[Dict[str, Any]] = []
    photos: List[str] = []  # list of photo IDs

class QuoteCreate(BaseModel):
    customer_id: str
    site_id: str
    job_id: Optional[str] = None
    lines: List[Dict[str, Any]]  # {description, quantity, unit_price, type: labour/parts/callout}
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

# ============== Auth Helpers ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== Auth Routes ==============

@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.role)
    return {"token": token, "user": {"id": user_id, "email": data.email, "name": data.name, "role": data.role}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/users/engineers")
async def get_engineers(user: dict = Depends(get_current_user)):
    engineers = await db.users.find({"role": "engineer"}, {"_id": 0, "password_hash": 0}).to_list(100)
    return engineers

# ============== Customer Routes ==============

@api_router.post("/customers", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, user: dict = Depends(get_current_user)):
    customer_id = str(uuid.uuid4())
    doc = {
        "id": customer_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.customers.insert_one(doc)
    return {**doc, "id": customer_id}

@api_router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(user: dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@api_router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@api_router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerCreate, user: dict = Depends(get_current_user)):
    result = await db.customers.update_one({"id": customer_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return await db.customers.find_one({"id": customer_id}, {"_id": 0})

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(get_current_user)):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}

# ============== Site Routes ==============

@api_router.post("/sites", response_model=SiteResponse)
async def create_site(data: SiteCreate, user: dict = Depends(get_current_user)):
    site_id = str(uuid.uuid4())
    doc = {
        "id": site_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sites.insert_one(doc)
    return {**doc, "id": site_id}

@api_router.get("/sites", response_model=List[SiteResponse])
async def get_sites(customer_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"customer_id": customer_id} if customer_id else {}
    sites = await db.sites.find(query, {"_id": 0}).to_list(1000)
    return sites

@api_router.get("/sites/{site_id}", response_model=SiteResponse)
async def get_site(site_id: str, user: dict = Depends(get_current_user)):
    site = await db.sites.find_one({"id": site_id}, {"_id": 0})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site

@api_router.put("/sites/{site_id}", response_model=SiteResponse)
async def update_site(site_id: str, data: SiteCreate, user: dict = Depends(get_current_user)):
    result = await db.sites.update_one({"id": site_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Site not found")
    return await db.sites.find_one({"id": site_id}, {"_id": 0})

@api_router.delete("/sites/{site_id}")
async def delete_site(site_id: str, user: dict = Depends(get_current_user)):
    result = await db.sites.delete_one({"id": site_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Site not found")
    return {"message": "Site deleted"}

# ============== Asset Routes ==============

@api_router.post("/assets", response_model=AssetResponse)
async def create_asset(data: AssetCreate, user: dict = Depends(get_current_user)):
    asset_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    next_pm_due = None
    if data.install_date:
        try:
            install = datetime.fromisoformat(data.install_date.replace('Z', '+00:00'))
            next_pm_due = (install + timedelta(days=data.pm_interval_months * 30)).isoformat()
        except:
            pass
    
    doc = {
        "id": asset_id,
        **data.model_dump(),
        "last_service_date": None,
        "next_pm_due": next_pm_due,
        "created_at": now.isoformat()
    }
    await db.assets.insert_one(doc)
    return {**doc, "id": asset_id}

@api_router.get("/assets", response_model=List[AssetResponse])
async def get_assets(site_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"site_id": site_id} if site_id else {}
    assets = await db.assets.find(query, {"_id": 0}).to_list(1000)
    return assets

@api_router.get("/assets/pm-due")
async def get_assets_pm_due(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    assets = await db.assets.find({"next_pm_due": {"$lte": now}}, {"_id": 0}).to_list(100)
    return assets

@api_router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, user: dict = Depends(get_current_user)):
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@api_router.put("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, data: AssetCreate, user: dict = Depends(get_current_user)):
    result = await db.assets.update_one({"id": asset_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return await db.assets.find_one({"id": asset_id}, {"_id": 0})

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, user: dict = Depends(get_current_user)):
    result = await db.assets.delete_one({"id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted"}

@api_router.get("/assets/{asset_id}/history")
async def get_asset_history(asset_id: str, user: dict = Depends(get_current_user)):
    jobs = await db.jobs.find({"asset_ids": asset_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return jobs

# ============== Job Routes ==============

async def generate_job_number():
    count = await db.jobs.count_documents({})
    return f"JOB-{str(count + 1).zfill(5)}"

@api_router.post("/jobs", response_model=JobResponse)
async def create_job(data: JobCreate, user: dict = Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    job_number = await generate_job_number()
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": job_id,
        "job_number": job_number,
        **data.model_dump(),
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "created_by": user["id"]
    }
    await db.jobs.insert_one(doc)
    
    # Create audit log
    await db.job_events.insert_one({
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "event_type": "created",
        "user_id": user["id"],
        "timestamp": now,
        "details": {"status": "pending"}
    })
    
    return {**doc}

@api_router.get("/jobs", response_model=List[JobResponse])
async def get_jobs(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    engineer_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    job_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if engineer_id:
        query["assigned_engineer_id"] = engineer_id
    if customer_id:
        query["customer_id"] = customer_id
    if job_type:
        query["job_type"] = job_type
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return jobs

@api_router.get("/jobs/scheduled")
async def get_scheduled_jobs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"scheduled_date": {"$ne": None}}
    if start_date:
        query["scheduled_date"]["$gte"] = start_date
    if end_date:
        query["scheduled_date"]["$lte"] = end_date
    
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(1000)
    return jobs

@api_router.get("/jobs/my-jobs")
async def get_my_jobs(user: dict = Depends(get_current_user)):
    jobs = await db.jobs.find(
        {"assigned_engineer_id": user["id"], "status": {"$in": ["pending", "in_progress", "travelling"]}},
        {"_id": 0}
    ).sort("scheduled_date", 1).to_list(100)
    return jobs

@api_router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@api_router.put("/jobs/{job_id}")
async def update_job(job_id: str, data: JobUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    old_job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not old_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    
    # Log status change
    if data.status and data.status != old_job.get("status"):
        await db.job_events.insert_one({
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "event_type": "status_changed",
            "user_id": user["id"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": {"old_status": old_job.get("status"), "new_status": data.status}
        })
    
    return await db.jobs.find_one({"id": job_id}, {"_id": 0})

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, user: dict = Depends(get_current_user)):
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted"}

@api_router.get("/jobs/{job_id}/events")
async def get_job_events(job_id: str, user: dict = Depends(get_current_user)):
    events = await db.job_events.find({"job_id": job_id}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return events

@api_router.post("/jobs/{job_id}/complete")
async def complete_job(job_id: str, data: JobCompletionCreate, user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Save completion data
    completion_doc = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        **data.model_dump(),
        "completed_by": user["id"],
        "completed_at": now
    }
    await db.job_completions.insert_one(completion_doc)
    
    # Update job status
    await db.jobs.update_one({"id": job_id}, {"$set": {"status": "completed", "updated_at": now}})
    
    # Update asset service dates
    for asset_id in job.get("asset_ids", []):
        asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
        if asset:
            pm_months = asset.get("pm_interval_months", 6)
            next_pm = (datetime.now(timezone.utc) + timedelta(days=pm_months * 30)).isoformat()
            await db.assets.update_one({"id": asset_id}, {"$set": {"last_service_date": now, "next_pm_due": next_pm}})
    
    # Log completion
    await db.job_events.insert_one({
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "event_type": "completed",
        "user_id": user["id"],
        "timestamp": now,
        "details": {"travel_time": data.travel_time, "time_on_site": data.time_on_site}
    })
    
    return {"message": "Job completed", "completion_id": completion_doc["id"]}

@api_router.get("/jobs/{job_id}/completion")
async def get_job_completion(job_id: str, user: dict = Depends(get_current_user)):
    completion = await db.job_completions.find_one({"job_id": job_id}, {"_id": 0})
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    return completion

# ============== Checklist Templates ==============

@api_router.post("/checklist-templates")
async def create_checklist_template(data: dict, user: dict = Depends(get_current_user)):
    template_id = str(uuid.uuid4())
    doc = {
        "id": template_id,
        "name": data.get("name", ""),
        "asset_type": data.get("asset_type", ""),
        "items": data.get("items", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.checklist_templates.insert_one(doc)
    return doc

@api_router.get("/checklist-templates")
async def get_checklist_templates(asset_type: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"asset_type": asset_type} if asset_type else {}
    templates = await db.checklist_templates.find(query, {"_id": 0}).to_list(100)
    return templates

# ============== Quote Routes ==============

async def generate_quote_number():
    count = await db.quotes.count_documents({})
    return f"QUO-{str(count + 1).zfill(5)}"

@api_router.post("/quotes", response_model=QuoteResponse)
async def create_quote(data: QuoteCreate, user: dict = Depends(get_current_user)):
    quote_id = str(uuid.uuid4())
    quote_number = await generate_quote_number()
    now = datetime.now(timezone.utc)
    
    subtotal = sum(line.get("quantity", 1) * line.get("unit_price", 0) for line in data.lines)
    vat = subtotal * 0.20
    total = subtotal + vat
    
    doc = {
        "id": quote_id,
        "quote_number": quote_number,
        **data.model_dump(),
        "subtotal": subtotal,
        "vat": vat,
        "total": total,
        "status": "draft",
        "valid_until": (now + timedelta(days=data.valid_days)).isoformat(),
        "created_at": now.isoformat()
    }
    await db.quotes.insert_one(doc)
    return doc

@api_router.get("/quotes", response_model=List[QuoteResponse])
async def get_quotes(status: Optional[str] = None, customer_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    quotes = await db.quotes.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return quotes

@api_router.get("/quotes/{quote_id}", response_model=QuoteResponse)
async def get_quote(quote_id: str, user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote

@api_router.put("/quotes/{quote_id}/status")
async def update_quote_status(quote_id: str, status: str, user: dict = Depends(get_current_user)):
    result = await db.quotes.update_one({"id": quote_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote status updated"}

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, user: dict = Depends(get_current_user)):
    result = await db.quotes.delete_one({"id": quote_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote deleted"}

# ============== Invoice Routes ==============

async def generate_invoice_number():
    count = await db.invoices.count_documents({})
    return f"INV-{str(count + 1).zfill(5)}"

@api_router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(data: InvoiceCreate, user: dict = Depends(get_current_user)):
    invoice_id = str(uuid.uuid4())
    invoice_number = await generate_invoice_number()
    now = datetime.now(timezone.utc)
    
    subtotal = sum(line.get("quantity", 1) * line.get("unit_price", 0) for line in data.lines)
    vat = subtotal * 0.20
    total = subtotal + vat
    
    doc = {
        "id": invoice_id,
        "invoice_number": invoice_number,
        **data.model_dump(),
        "subtotal": subtotal,
        "vat": vat,
        "total": total,
        "status": "unpaid",
        "due_date": (now + timedelta(days=data.due_days)).isoformat(),
        "created_at": now.isoformat()
    }
    await db.invoices.insert_one(doc)
    return doc

@api_router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(status: Optional[str] = None, customer_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@api_router.put("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str, user: dict = Depends(get_current_user)):
    result = await db.invoices.update_one({"id": invoice_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice status updated"}

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted"}

# ============== Parts Routes ==============

@api_router.post("/parts", response_model=PartResponse)
async def create_part(data: PartCreate, user: dict = Depends(get_current_user)):
    part_id = str(uuid.uuid4())
    doc = {
        "id": part_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.parts.insert_one(doc)
    return doc

@api_router.get("/parts", response_model=List[PartResponse])
async def get_parts(user: dict = Depends(get_current_user)):
    parts = await db.parts.find({}, {"_id": 0}).to_list(1000)
    return parts

@api_router.get("/parts/{part_id}", response_model=PartResponse)
async def get_part(part_id: str, user: dict = Depends(get_current_user)):
    part = await db.parts.find_one({"id": part_id}, {"_id": 0})
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@api_router.put("/parts/{part_id}", response_model=PartResponse)
async def update_part(part_id: str, data: PartCreate, user: dict = Depends(get_current_user)):
    result = await db.parts.update_one({"id": part_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Part not found")
    return await db.parts.find_one({"id": part_id}, {"_id": 0})

@api_router.delete("/parts/{part_id}")
async def delete_part(part_id: str, user: dict = Depends(get_current_user)):
    result = await db.parts.delete_one({"id": part_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Part not found")
    return {"message": "Part deleted"}

# ============== File Upload Routes ==============

@api_router.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_path = UPLOAD_DIR / f"{file_id}.{file_ext}"
    
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    photo_doc = {
        "id": file_id,
        "filename": file.filename,
        "path": str(file_path),
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    await db.photos.insert_one(photo_doc)
    
    return {"id": file_id, "filename": file.filename}

@api_router.get("/photos/{photo_id}")
async def get_photo(photo_id: str):
    photo = await db.photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    file_path = Path(photo["path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    async with aiofiles.open(file_path, "rb") as f:
        content = await f.read()
    
    return StreamingResponse(BytesIO(content), media_type="image/jpeg")

# ============== PDF Generation ==============

@api_router.get("/jobs/{job_id}/pdf")
async def generate_job_pdf(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    customer = await db.customers.find_one({"id": job["customer_id"]}, {"_id": 0})
    site = await db.sites.find_one({"id": job["site_id"]}, {"_id": 0})
    completion = await db.job_completions.find_one({"job_id": job_id}, {"_id": 0})
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#06b6d4'))
    
    elements = []
    
    # Header
    elements.append(Paragraph("CRAVEN COOLING SERVICES LTD", title_style))
    elements.append(Paragraph("Service Report", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    # Job Info Table
    job_data = [
        ["Job Number:", job.get("job_number", "")],
        ["Type:", job.get("job_type", "").replace("_", " ").title()],
        ["Status:", job.get("status", "").replace("_", " ").title()],
        ["Priority:", job.get("priority", "").title()],
        ["Date:", job.get("scheduled_date", "N/A")],
    ]
    
    t = Table(job_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#0f172a')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # Customer Info
    elements.append(Paragraph("Customer Details", styles['Heading3']))
    if customer:
        cust_data = [
            ["Company:", customer.get("company_name", "")],
            ["Address:", customer.get("billing_address", "")],
            ["Phone:", customer.get("phone", "")],
        ]
        t2 = Table(cust_data, colWidths=[2*inch, 4*inch])
        t2.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t2)
    elements.append(Spacer(1, 20))
    
    # Site Info
    elements.append(Paragraph("Site Details", styles['Heading3']))
    if site:
        site_data = [
            ["Site:", site.get("name", "")],
            ["Address:", site.get("address", "")],
            ["Access Notes:", site.get("access_notes", "")],
        ]
        t3 = Table(site_data, colWidths=[2*inch, 4*inch])
        t3.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t3)
    elements.append(Spacer(1, 20))
    
    # Description
    elements.append(Paragraph("Job Description", styles['Heading3']))
    elements.append(Paragraph(job.get("description", ""), styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Completion Details
    if completion:
        elements.append(Paragraph("Work Completed", styles['Heading3']))
        elements.append(Paragraph(completion.get("engineer_notes", ""), styles['Normal']))
        elements.append(Spacer(1, 10))
        
        time_data = [
            ["Travel Time:", f"{completion.get('travel_time', 0)} minutes"],
            ["Time on Site:", f"{completion.get('time_on_site', 0)} minutes"],
        ]
        t4 = Table(time_data, colWidths=[2*inch, 4*inch])
        t4.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t4)
        
        # Parts Used
        if completion.get("parts_used"):
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("Parts Used", styles['Heading3']))
            parts_data = [["Part", "Quantity"]]
            for part in completion["parts_used"]:
                parts_data.append([part.get("name", ""), str(part.get("quantity", 1))])
            
            t5 = Table(parts_data, colWidths=[4*inch, 2*inch])
            t5.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#06b6d4')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(t5)
    
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Customer Signature: ________________________", styles['Normal']))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=job-{job.get('job_number', job_id)}.pdf"}
    )

@api_router.get("/quotes/{quote_id}/pdf")
async def generate_quote_pdf(quote_id: str, user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    customer = await db.customers.find_one({"id": quote["customer_id"]}, {"_id": 0})
    site = await db.sites.find_one({"id": quote["site_id"]}, {"_id": 0})
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#06b6d4'))
    
    elements = []
    
    elements.append(Paragraph("CRAVEN COOLING SERVICES LTD", title_style))
    elements.append(Paragraph("QUOTATION", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    # Quote Info
    info_data = [
        ["Quote Number:", quote.get("quote_number", "")],
        ["Date:", quote.get("created_at", "")[:10]],
        ["Valid Until:", quote.get("valid_until", "")[:10]],
    ]
    t = Table(info_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # Customer
    if customer:
        elements.append(Paragraph(f"To: {customer.get('company_name', '')}", styles['Normal']))
        elements.append(Paragraph(customer.get('billing_address', ''), styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Line Items
    lines_data = [["Description", "Type", "Qty", "Unit Price", "Total"]]
    for line in quote.get("lines", []):
        qty = line.get("quantity", 1)
        price = line.get("unit_price", 0)
        lines_data.append([
            line.get("description", ""),
            line.get("type", "").title(),
            str(qty),
            f"£{price:.2f}",
            f"£{qty * price:.2f}"
        ])
    
    t2 = Table(lines_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 10))
    
    # Totals
    totals_data = [
        ["", "", "", "Subtotal:", f"£{quote.get('subtotal', 0):.2f}"],
        ["", "", "", "VAT (20%):", f"£{quote.get('vat', 0):.2f}"],
        ["", "", "", "Total:", f"£{quote.get('total', 0):.2f}"],
    ]
    t3 = Table(totals_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t3.setStyle(TableStyle([
        ('FONTNAME', (3, 2), (4, 2), 'Helvetica-Bold'),
        ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
    ]))
    elements.append(t3)
    
    if quote.get("notes"):
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Notes:", styles['Heading3']))
        elements.append(Paragraph(quote.get("notes", ""), styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=quote-{quote.get('quote_number', quote_id)}.pdf"}
    )

@api_router.get("/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf(invoice_id: str, user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    customer = await db.customers.find_one({"id": invoice["customer_id"]}, {"_id": 0})
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#06b6d4'))
    
    elements = []
    
    elements.append(Paragraph("CRAVEN COOLING SERVICES LTD", title_style))
    elements.append(Paragraph("INVOICE", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    # Invoice Info
    info_data = [
        ["Invoice Number:", invoice.get("invoice_number", "")],
        ["Date:", invoice.get("created_at", "")[:10]],
        ["Due Date:", invoice.get("due_date", "")[:10]],
        ["Status:", invoice.get("status", "").upper()],
    ]
    t = Table(info_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # Customer
    if customer:
        elements.append(Paragraph(f"Bill To: {customer.get('company_name', '')}", styles['Normal']))
        elements.append(Paragraph(customer.get('billing_address', ''), styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Line Items
    lines_data = [["Description", "Type", "Qty", "Unit Price", "Total"]]
    for line in invoice.get("lines", []):
        qty = line.get("quantity", 1)
        price = line.get("unit_price", 0)
        lines_data.append([
            line.get("description", ""),
            line.get("type", "").title(),
            str(qty),
            f"£{price:.2f}",
            f"£{qty * price:.2f}"
        ])
    
    t2 = Table(lines_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 10))
    
    # Totals
    totals_data = [
        ["", "", "", "Subtotal:", f"£{invoice.get('subtotal', 0):.2f}"],
        ["", "", "", "VAT (20%):", f"£{invoice.get('vat', 0):.2f}"],
        ["", "", "", "Total:", f"£{invoice.get('total', 0):.2f}"],
    ]
    t3 = Table(totals_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t3.setStyle(TableStyle([
        ('FONTNAME', (3, 2), (4, 2), 'Helvetica-Bold'),
        ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
    ]))
    elements.append(t3)
    
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Payment Terms: Net 30 days", styles['Normal']))
    elements.append(Paragraph("Bank: [Bank Details Here]", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice-{invoice.get('invoice_number', invoice_id)}.pdf"}
    )

# ============== Dashboard/Reports ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    
    total_jobs = await db.jobs.count_documents({})
    pending_jobs = await db.jobs.count_documents({"status": "pending"})
    in_progress_jobs = await db.jobs.count_documents({"status": "in_progress"})
    completed_this_week = await db.jobs.count_documents({"status": "completed", "updated_at": {"$gte": week_ago}})
    urgent_jobs = await db.jobs.count_documents({"priority": "urgent", "status": {"$ne": "completed"}})
    
    pm_due = await db.assets.count_documents({"next_pm_due": {"$lte": now.isoformat()}})
    
    total_customers = await db.customers.count_documents({})
    total_assets = await db.assets.count_documents({})
    
    unpaid_invoices = await db.invoices.find({"status": "unpaid"}, {"_id": 0, "total": 1}).to_list(1000)
    outstanding_amount = sum(inv.get("total", 0) for inv in unpaid_invoices)
    
    return {
        "total_jobs": total_jobs,
        "pending_jobs": pending_jobs,
        "in_progress_jobs": in_progress_jobs,
        "completed_this_week": completed_this_week,
        "urgent_jobs": urgent_jobs,
        "pm_due": pm_due,
        "total_customers": total_customers,
        "total_assets": total_assets,
        "outstanding_amount": outstanding_amount
    }

@api_router.get("/reports/jobs-by-status")
async def get_jobs_by_status(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    results = await db.jobs.aggregate(pipeline).to_list(100)
    return {r["_id"]: r["count"] for r in results}

@api_router.get("/reports/jobs-by-engineer")
async def get_jobs_by_engineer(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"assigned_engineer_id": {"$ne": None}}},
        {"$group": {"_id": "$assigned_engineer_id", "count": {"$sum": 1}}}
    ]
    results = await db.jobs.aggregate(pipeline).to_list(100)
    
    # Get engineer names
    engineer_ids = [r["_id"] for r in results]
    engineers = await db.users.find({"id": {"$in": engineer_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    engineer_map = {e["id"]: e["name"] for e in engineers}
    
    return [{"engineer_id": r["_id"], "engineer_name": engineer_map.get(r["_id"], "Unknown"), "count": r["count"]} for r in results]

@api_router.get("/reports/pm-due-list")
async def get_pm_due_list(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    assets = await db.assets.find({"next_pm_due": {"$lte": now}}, {"_id": 0}).to_list(100)
    
    # Enrich with site info
    for asset in assets:
        site = await db.sites.find_one({"id": asset.get("site_id")}, {"_id": 0, "name": 1, "address": 1})
        asset["site"] = site
    
    return assets

# ============== AI Routes (Optional) ==============

@api_router.post("/ai/summarize-notes")
async def summarize_notes(data: dict, user: dict = Depends(get_current_user)):
    notes = data.get("notes", "")
    provider = data.get("provider", "openai")  # openai or gemini
    
    api_key = os.environ.get("OPENAI_API_KEY") if provider == "openai" else os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="AI key not configured")
    
    try:
        import litellm
        
        model = "gemini/gemini-1.5-flash" if provider == "gemini" else "gpt-4o-mini"
        
        response = await litellm.acompletion(
            model=model,
            messages=[
                {"role": "system", "content": "You are an assistant for a refrigeration/HVAC field service company. Summarize job notes concisely."},
                {"role": "user", "content": f"Summarize these job notes:\n\n{notes}"}
            ],
            api_key=api_key
        )
        
        return {"summary": response.choices[0].message.content}
    except Exception as e:
        logger.error(f"AI summarization error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")

# ============== Health Check ==============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============== PM Automation ==============

@api_router.post("/pm/generate-jobs")
async def generate_pm_jobs(user: dict = Depends(get_current_user)):
    """Auto-generate PM jobs for assets that are due"""
    now = datetime.now(timezone.utc)
    
    # Find assets with PM due
    assets_due = await db.assets.find({"next_pm_due": {"$lte": now.isoformat()}}, {"_id": 0}).to_list(100)
    
    jobs_created = []
    for asset in assets_due:
        # Check if there's already an open PM job for this asset
        existing_job = await db.jobs.find_one({
            "asset_ids": asset["id"],
            "job_type": "pm_service",
            "status": {"$in": ["pending", "in_progress", "travelling"]}
        })
        
        if existing_job:
            continue  # Skip - already has an open PM job
        
        # Get site info
        site = await db.sites.find_one({"id": asset.get("site_id")}, {"_id": 0})
        if not site:
            continue
        
        # Create PM job
        job_id = str(uuid.uuid4())
        job_number = await generate_job_number()
        
        job_doc = {
            "id": job_id,
            "job_number": job_number,
            "customer_id": site.get("customer_id"),
            "site_id": asset.get("site_id"),
            "asset_ids": [asset["id"]],
            "job_type": "pm_service",
            "priority": "medium",
            "status": "pending",
            "description": f"Scheduled PM Service for {asset.get('name')} - {asset.get('make', '')} {asset.get('model', '')}",
            "assigned_engineer_id": None,
            "scheduled_date": None,
            "scheduled_time": None,
            "estimated_duration": 60,
            "sla_hours": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "created_by": "system",
            "auto_generated": True
        }
        
        await db.jobs.insert_one(job_doc)
        jobs_created.append({"job_number": job_number, "asset": asset.get("name")})
        
        # Log event
        await db.job_events.insert_one({
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "event_type": "auto_generated",
            "user_id": "system",
            "timestamp": now.isoformat(),
            "details": {"reason": "PM due", "asset_id": asset["id"]}
        })
    
    return {"jobs_created": len(jobs_created), "details": jobs_created}

@api_router.get("/pm/status")
async def get_pm_status(user: dict = Depends(get_current_user)):
    """Get PM automation status and upcoming PMs"""
    now = datetime.now(timezone.utc)
    next_week = (now + timedelta(days=7)).isoformat()
    next_month = (now + timedelta(days=30)).isoformat()
    
    overdue = await db.assets.count_documents({"next_pm_due": {"$lte": now.isoformat()}})
    due_this_week = await db.assets.count_documents({
        "next_pm_due": {"$gt": now.isoformat(), "$lte": next_week}
    })
    due_this_month = await db.assets.count_documents({
        "next_pm_due": {"$gt": next_week, "$lte": next_month}
    })
    
    return {
        "overdue": overdue,
        "due_this_week": due_this_week,
        "due_this_month": due_this_month,
        "last_check": now.isoformat()
    }

# ============== Customer Portal ==============

class CustomerPortalLogin(BaseModel):
    email: EmailStr
    access_code: str

class CustomerPortalCreate(BaseModel):
    customer_id: str
    email: EmailStr
    contact_name: str

@api_router.post("/portal/create-access")
async def create_customer_portal_access(data: CustomerPortalCreate, user: dict = Depends(get_current_user)):
    """Create portal access for a customer"""
    customer = await db.customers.find_one({"id": data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Generate access code
    access_code = str(uuid.uuid4())[:8].upper()
    
    portal_doc = {
        "id": str(uuid.uuid4()),
        "customer_id": data.customer_id,
        "email": data.email,
        "contact_name": data.contact_name,
        "access_code_hash": hash_password(access_code),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
        "active": True
    }
    
    await db.customer_portal.insert_one(portal_doc)
    
    return {
        "message": "Portal access created",
        "email": data.email,
        "access_code": access_code,  # Show only once
        "customer_name": customer.get("company_name")
    }

@api_router.post("/portal/login")
async def customer_portal_login(data: CustomerPortalLogin):
    """Customer portal login"""
    portal_user = await db.customer_portal.find_one({"email": data.email, "active": True}, {"_id": 0})
    if not portal_user or not verify_password(data.access_code, portal_user["access_code_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.customer_portal.update_one(
        {"id": portal_user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create portal token
    payload = {
        "sub": portal_user["id"],
        "customer_id": portal_user["customer_id"],
        "type": "portal",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    customer = await db.customers.find_one({"id": portal_user["customer_id"]}, {"_id": 0})
    
    return {
        "token": token,
        "customer_name": customer.get("company_name") if customer else "Unknown",
        "contact_name": portal_user.get("contact_name")
    }

async def get_portal_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify portal token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "portal":
            raise HTTPException(status_code=401, detail="Invalid portal token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/portal/dashboard")
async def portal_dashboard(portal: dict = Depends(get_portal_user)):
    """Customer portal dashboard"""
    customer_id = portal["customer_id"]
    
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    sites = await db.sites.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    site_ids = [s["id"] for s in sites]
    
    # Get assets for all sites
    assets = await db.assets.find({"site_id": {"$in": site_ids}}, {"_id": 0}).to_list(100)
    
    # Get jobs stats
    total_jobs = await db.jobs.count_documents({"customer_id": customer_id})
    completed_jobs = await db.jobs.count_documents({"customer_id": customer_id, "status": "completed"})
    pending_jobs = await db.jobs.count_documents({"customer_id": customer_id, "status": {"$in": ["pending", "in_progress"]}})
    
    # PM due
    now = datetime.now(timezone.utc).isoformat()
    pm_due_assets = [a for a in assets if a.get("next_pm_due") and a["next_pm_due"] <= now]
    
    return {
        "customer": customer,
        "sites_count": len(sites),
        "assets_count": len(assets),
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "pending_jobs": pending_jobs,
        "pm_due_count": len(pm_due_assets)
    }

@api_router.get("/portal/sites")
async def portal_get_sites(portal: dict = Depends(get_portal_user)):
    """Get customer's sites"""
    sites = await db.sites.find({"customer_id": portal["customer_id"]}, {"_id": 0}).to_list(100)
    return sites

@api_router.get("/portal/assets")
async def portal_get_assets(portal: dict = Depends(get_portal_user)):
    """Get customer's assets with PM status"""
    sites = await db.sites.find({"customer_id": portal["customer_id"]}, {"_id": 0, "id": 1}).to_list(100)
    site_ids = [s["id"] for s in sites]
    
    assets = await db.assets.find({"site_id": {"$in": site_ids}}, {"_id": 0}).to_list(100)
    
    # Enrich with site info
    for asset in assets:
        site = await db.sites.find_one({"id": asset.get("site_id")}, {"_id": 0, "name": 1, "address": 1})
        asset["site"] = site
    
    return assets

@api_router.get("/portal/service-history")
async def portal_service_history(portal: dict = Depends(get_portal_user)):
    """Get customer's service history"""
    jobs = await db.jobs.find(
        {"customer_id": portal["customer_id"], "status": "completed"},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    # Enrich with site info
    for job in jobs:
        site = await db.sites.find_one({"id": job.get("site_id")}, {"_id": 0, "name": 1})
        job["site"] = site
        
        # Get completion notes if available
        completion = await db.job_completions.find_one({"job_id": job["id"]}, {"_id": 0, "engineer_notes": 1})
        job["completion_notes"] = completion.get("engineer_notes") if completion else None
    
    return jobs

@api_router.get("/portal/upcoming-pm")
async def portal_upcoming_pm(portal: dict = Depends(get_portal_user)):
    """Get upcoming PM schedules"""
    sites = await db.sites.find({"customer_id": portal["customer_id"]}, {"_id": 0, "id": 1}).to_list(100)
    site_ids = [s["id"] for s in sites]
    
    # Get all assets sorted by next_pm_due
    assets = await db.assets.find(
        {"site_id": {"$in": site_ids}, "next_pm_due": {"$ne": None}},
        {"_id": 0}
    ).sort("next_pm_due", 1).to_list(100)
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = []
    for asset in assets:
        site = await db.sites.find_one({"id": asset.get("site_id")}, {"_id": 0, "name": 1})
        is_overdue = asset.get("next_pm_due", "") <= now
        result.append({
            "asset_id": asset["id"],
            "asset_name": asset.get("name"),
            "make_model": f"{asset.get('make', '')} {asset.get('model', '')}".strip(),
            "site_name": site.get("name") if site else "Unknown",
            "next_pm_due": asset.get("next_pm_due"),
            "pm_interval_months": asset.get("pm_interval_months"),
            "is_overdue": is_overdue
        })
    
    return result

@api_router.get("/portal/invoices")
async def portal_get_invoices(portal: dict = Depends(get_portal_user)):
    """Get customer's invoices"""
    invoices = await db.invoices.find(
        {"customer_id": portal["customer_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return invoices

# ============== Job Photos ==============

@api_router.post("/jobs/{job_id}/photos")
async def upload_job_photo(job_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload a photo to a job"""
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_path = UPLOAD_DIR / f"{file_id}.{file_ext}"
    
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    photo_doc = {
        "id": file_id,
        "job_id": job_id,
        "filename": file.filename,
        "path": str(file_path),
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    await db.job_photos.insert_one(photo_doc)
    
    return {"id": file_id, "filename": file.filename}

@api_router.get("/jobs/{job_id}/photos")
async def get_job_photos(job_id: str, user: dict = Depends(get_current_user)):
    """Get all photos for a job"""
    photos = await db.job_photos.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    return photos

@api_router.delete("/jobs/{job_id}/photos/{photo_id}")
async def delete_job_photo(job_id: str, photo_id: str, user: dict = Depends(get_current_user)):
    """Delete a job photo"""
    photo = await db.job_photos.find_one({"id": photo_id, "job_id": job_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Delete file
    file_path = Path(photo["path"])
    if file_path.exists():
        file_path.unlink()
    
    await db.job_photos.delete_one({"id": photo_id})
    return {"message": "Photo deleted"}

# ============== Portal Access Management ==============

@api_router.get("/portal/access-list")
async def get_portal_access_list(user: dict = Depends(get_current_user)):
    """Get all portal access entries"""
    portal_users = await db.customer_portal.find({}, {"_id": 0, "access_code_hash": 0}).to_list(100)
    
    # Enrich with customer names
    for pu in portal_users:
        customer = await db.customers.find_one({"id": pu.get("customer_id")}, {"_id": 0, "company_name": 1})
        pu["customer_name"] = customer.get("company_name") if customer else "Unknown"
    
    return portal_users

@api_router.delete("/portal/access/{access_id}")
async def revoke_portal_access(access_id: str, user: dict = Depends(get_current_user)):
    """Revoke portal access"""
    result = await db.customer_portal.delete_one({"id": access_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Access not found")
    return {"message": "Portal access revoked"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
