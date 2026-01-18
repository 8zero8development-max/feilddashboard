from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone, timedelta
import uuid
import jwt

from database import supabase
from services.auth import hash_password, verify_password, get_current_user, get_portal_user
from config import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/portal", tags=["portal"])


class CustomerPortalLogin(BaseModel):
    email: EmailStr
    access_code: str


class CustomerPortalCreate(BaseModel):
    customer_id: str
    email: EmailStr
    contact_name: str


@router.post("/create-access")
async def create_customer_portal_access(data: CustomerPortalCreate, user: dict = Depends(get_current_user)):
    customer_response = supabase.table('customers').select('*').eq('id', data.customer_id).execute()
    if not customer_response.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer = customer_response.data[0]
    
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
    
    supabase.table('customer_portal').insert(portal_doc).execute()
    
    return {
        "message": "Portal access created",
        "email": data.email,
        "access_code": access_code,
        "customer_name": customer.get("company_name")
    }


@router.post("/login")
async def customer_portal_login(data: CustomerPortalLogin):
    portal_user_response = supabase.table('customer_portal').select('*').eq('email', data.email).eq('active', True).execute()
    if not portal_user_response.data or not verify_password(data.access_code, portal_user_response.data[0]["access_code_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    portal_user = portal_user_response.data[0]
    
    supabase.table('customer_portal').update({"last_login": datetime.now(timezone.utc).isoformat()}).eq('id', portal_user["id"]).execute()
    
    payload = {
        "sub": portal_user["id"],
        "customer_id": portal_user["customer_id"],
        "type": "portal",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    customer_response = supabase.table('customers').select('*').eq('id', portal_user["customer_id"]).execute()
    customer = customer_response.data[0] if customer_response.data else None
    
    return {
        "token": token,
        "customer_name": customer.get("company_name") if customer else "Unknown",
        "contact_name": portal_user.get("contact_name")
    }


@router.get("/dashboard")
async def portal_dashboard(portal: dict = Depends(get_portal_user)):
    customer_id = portal["customer_id"]
    
    customer_response = supabase.table('customers').select('*').eq('id', customer_id).execute()
    customer = customer_response.data[0] if customer_response.data else None
    
    sites_response = supabase.table('sites').select('*').eq('customer_id', customer_id).limit(100).execute()
    sites = sites_response.data
    site_ids = [s["id"] for s in sites]
    
    if site_ids:
        assets_response = supabase.table('assets').select('*').in_('site_id', site_ids).limit(100).execute()
        assets = assets_response.data
    else:
        assets = []
    
    total_jobs_response = supabase.table('jobs').select('*', count='exact').eq('customer_id', customer_id).execute()
    total_jobs = total_jobs_response.count if total_jobs_response.count else 0
    
    completed_jobs_response = supabase.table('jobs').select('*', count='exact').eq('customer_id', customer_id).eq('status', 'completed').execute()
    completed_jobs = completed_jobs_response.count if completed_jobs_response.count else 0
    
    pending_jobs_response = supabase.table('jobs').select('*', count='exact').eq('customer_id', customer_id).in_('status', ['pending', 'in_progress']).execute()
    pending_jobs = pending_jobs_response.count if pending_jobs_response.count else 0
    
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


@router.get("/sites")
async def portal_get_sites(portal: dict = Depends(get_portal_user)):
    response = supabase.table('sites').select('*').eq('customer_id', portal["customer_id"]).limit(100).execute()
    return response.data


@router.get("/assets")
async def portal_get_assets(portal: dict = Depends(get_portal_user)):
    sites_response = supabase.table('sites').select('id').eq('customer_id', portal["customer_id"]).limit(100).execute()
    site_ids = [s["id"] for s in sites_response.data]
    
    if not site_ids:
        return []
    
    assets_response = supabase.table('assets').select('*').in_('site_id', site_ids).limit(100).execute()
    assets = assets_response.data
    
    for asset in assets:
        site_response = supabase.table('sites').select('name, address').eq('id', asset.get("site_id")).execute()
        asset["site"] = site_response.data[0] if site_response.data else None
    
    return assets


@router.get("/service-history")
async def portal_service_history(portal: dict = Depends(get_portal_user)):
    jobs_response = supabase.table('jobs').select('*').eq('customer_id', portal["customer_id"]).eq('status', 'completed').order('updated_at', desc=True).limit(100).execute()
    jobs = jobs_response.data
    
    for job in jobs:
        site_response = supabase.table('sites').select('name').eq('id', job.get("site_id")).execute()
        job["site"] = site_response.data[0] if site_response.data else None
        
        completion_response = supabase.table('job_completions').select('engineer_notes').eq('job_id', job["id"]).execute()
        job["completion_notes"] = completion_response.data[0].get("engineer_notes") if completion_response.data else None
    
    return jobs


@router.get("/upcoming-pm")
async def portal_upcoming_pm(portal: dict = Depends(get_portal_user)):
    sites_response = supabase.table('sites').select('id').eq('customer_id', portal["customer_id"]).limit(100).execute()
    site_ids = [s["id"] for s in sites_response.data]
    
    if not site_ids:
        return []
    
    assets_response = supabase.table('assets').select('*').in_('site_id', site_ids).not_.is_('next_pm_due', 'null').order('next_pm_due').limit(100).execute()
    assets = assets_response.data
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = []
    for asset in assets:
        site_response = supabase.table('sites').select('name').eq('id', asset.get("site_id")).execute()
        site = site_response.data[0] if site_response.data else None
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


@router.get("/invoices")
async def portal_get_invoices(portal: dict = Depends(get_portal_user)):
    response = supabase.table('invoices').select('*').eq('customer_id', portal["customer_id"]).order('created_at', desc=True).limit(100).execute()
    return response.data


@router.get("/access-list")
async def get_portal_access_list(user: dict = Depends(get_current_user)):
    portal_users_response = supabase.table('customer_portal').select('id, customer_id, email, contact_name, created_at, last_login, active').limit(100).execute()
    portal_users = portal_users_response.data
    
    for pu in portal_users:
        customer_response = supabase.table('customers').select('company_name').eq('id', pu.get("customer_id")).execute()
        pu["customer_name"] = customer_response.data[0].get("company_name") if customer_response.data else "Unknown"
    
    return portal_users


@router.delete("/access/{access_id}")
async def revoke_portal_access(access_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('customer_portal').delete().eq('id', access_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Access not found")
    return {"message": "Portal access revoked"}
