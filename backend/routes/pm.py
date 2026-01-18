from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
import uuid

from database import supabase
from services.auth import get_current_user

router = APIRouter(prefix="/pm", tags=["pm"])


def generate_job_number():
    response = supabase.table('jobs').select('*', count='exact').execute()
    count = response.count if response.count else 0
    return f"JOB-{str(count + 1).zfill(5)}"


@router.post("/generate-jobs")
async def generate_pm_jobs(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    
    assets_due_response = supabase.table('assets').select('*').lte('next_pm_due', now.isoformat()).limit(100).execute()
    assets_due = assets_due_response.data
    
    jobs_created = []
    for asset in assets_due:
        existing_job_response = supabase.table('jobs').select('*').contains('asset_ids', [asset["id"]]).eq('job_type', 'pm_service').in_('status', ['pending', 'in_progress', 'travelling']).execute()
        
        if existing_job_response.data:
            continue
        
        site_response = supabase.table('sites').select('*').eq('id', asset.get("site_id")).execute()
        if not site_response.data:
            continue
        site = site_response.data[0]
        
        job_id = str(uuid.uuid4())
        job_number = generate_job_number()
        
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
        
        supabase.table('jobs').insert(job_doc).execute()
        jobs_created.append({"job_number": job_number, "asset": asset.get("name")})
        
        supabase.table('job_events').insert({
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "event_type": "auto_generated",
            "user_id": "system",
            "timestamp": now.isoformat(),
            "details": {"reason": "PM due", "asset_id": asset["id"]}
        }).execute()
    
    return {"jobs_created": len(jobs_created), "details": jobs_created}


@router.get("/status")
async def get_pm_status(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    next_week = (now + timedelta(days=7)).isoformat()
    next_month = (now + timedelta(days=30)).isoformat()
    
    overdue_response = supabase.table('assets').select('*', count='exact').lte('next_pm_due', now.isoformat()).execute()
    overdue = overdue_response.count if overdue_response.count else 0
    
    due_this_week_response = supabase.table('assets').select('*', count='exact').gt('next_pm_due', now.isoformat()).lte('next_pm_due', next_week).execute()
    due_this_week = due_this_week_response.count if due_this_week_response.count else 0
    
    due_this_month_response = supabase.table('assets').select('*', count='exact').gt('next_pm_due', next_week).lte('next_pm_due', next_month).execute()
    due_this_month = due_this_month_response.count if due_this_month_response.count else 0
    
    return {
        "overdue": overdue,
        "due_this_week": due_this_week,
        "due_this_month": due_this_month,
        "last_check": now.isoformat()
    }
