from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta

from database import supabase
from services.auth import get_current_user

router = APIRouter(tags=["reports"])


@router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    
    total_jobs_response = supabase.table('jobs').select('*', count='exact').execute()
    total_jobs = total_jobs_response.count if total_jobs_response.count else 0
    
    pending_jobs_response = supabase.table('jobs').select('*', count='exact').eq('status', 'pending').execute()
    pending_jobs = pending_jobs_response.count if pending_jobs_response.count else 0
    
    in_progress_jobs_response = supabase.table('jobs').select('*', count='exact').eq('status', 'in_progress').execute()
    in_progress_jobs = in_progress_jobs_response.count if in_progress_jobs_response.count else 0
    
    completed_this_week_response = supabase.table('jobs').select('*', count='exact').eq('status', 'completed').gte('updated_at', week_ago).execute()
    completed_this_week = completed_this_week_response.count if completed_this_week_response.count else 0
    
    urgent_jobs_response = supabase.table('jobs').select('*', count='exact').eq('priority', 'urgent').neq('status', 'completed').execute()
    urgent_jobs = urgent_jobs_response.count if urgent_jobs_response.count else 0
    
    pm_due_response = supabase.table('assets').select('*', count='exact').lte('next_pm_due', now.isoformat()).execute()
    pm_due = pm_due_response.count if pm_due_response.count else 0
    
    total_customers_response = supabase.table('customers').select('*', count='exact').execute()
    total_customers = total_customers_response.count if total_customers_response.count else 0
    
    total_assets_response = supabase.table('assets').select('*', count='exact').execute()
    total_assets = total_assets_response.count if total_assets_response.count else 0
    
    unpaid_invoices_response = supabase.table('invoices').select('total').eq('status', 'unpaid').execute()
    outstanding_amount = sum(inv.get("total", 0) for inv in unpaid_invoices_response.data)
    
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


@router.get("/reports/jobs-by-status")
async def get_jobs_by_status(user: dict = Depends(get_current_user)):
    response = supabase.table('jobs').select('status').execute()
    status_counts = {}
    for job in response.data:
        status = job.get('status')
        status_counts[status] = status_counts.get(status, 0) + 1
    return status_counts


@router.get("/reports/jobs-by-engineer")
async def get_jobs_by_engineer(user: dict = Depends(get_current_user)):
    jobs_response = supabase.table('jobs').select('assigned_engineer_id').not_.is_('assigned_engineer_id', 'null').execute()
    
    engineer_counts = {}
    for job in jobs_response.data:
        eng_id = job.get('assigned_engineer_id')
        engineer_counts[eng_id] = engineer_counts.get(eng_id, 0) + 1
    
    engineer_ids = list(engineer_counts.keys())
    if engineer_ids:
        engineers_response = supabase.table('users').select('id, name').in_('id', engineer_ids).execute()
        engineer_map = {e["id"]: e["name"] for e in engineers_response.data}
    else:
        engineer_map = {}
    
    return [{"engineer_id": eng_id, "engineer_name": engineer_map.get(eng_id, "Unknown"), "count": count} for eng_id, count in engineer_counts.items()]


@router.get("/reports/pm-due-list")
async def get_pm_due_list(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    assets_response = supabase.table('assets').select('*').lte('next_pm_due', now).limit(100).execute()
    assets = assets_response.data
    
    for asset in assets:
        site_response = supabase.table('sites').select('name, address').eq('id', asset.get("site_id")).execute()
        asset["site"] = site_response.data[0] if site_response.data else None
    
    return assets
