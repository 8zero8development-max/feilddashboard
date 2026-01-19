from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

from database import supabase
from models.asset import FGasLogCreate, FGasLogResponse
from services.auth import get_current_user

router = APIRouter(prefix="/fgas", tags=["fgas"])


@router.post("/logs", response_model=FGasLogResponse)
async def create_fgas_log(data: FGasLogCreate, user: dict = Depends(get_current_user)):
    log_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    doc = {
        "id": log_id,
        **data.model_dump(),
        "created_at": now.isoformat()
    }
    supabase.table('fgas_logs').insert(doc).execute()
    
    if data.log_type == "leak_check" and data.asset_id:
        asset_response = supabase.table('assets').select('*').eq('id', data.asset_id).execute()
        if asset_response.data:
            asset = asset_response.data[0]
            leak_check_interval = asset.get("fgas_leak_check_interval", 12)
            next_leak_check = (now + timedelta(days=leak_check_interval * 30)).isoformat()
            supabase.table('assets').update({
                "fgas_last_leak_check": now.isoformat(),
                "fgas_next_leak_check_due": next_leak_check
            }).eq('id', data.asset_id).execute()
    
    return doc


@router.get("/logs", response_model=List[FGasLogResponse])
async def get_fgas_logs(
    asset_id: Optional[str] = None,
    job_id: Optional[str] = None,
    log_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = supabase.table('fgas_logs').select('*')
    if asset_id:
        query = query.eq('asset_id', asset_id)
    if job_id:
        query = query.eq('job_id', job_id)
    if log_type:
        query = query.eq('log_type', log_type)
    
    response = query.order('created_at', desc=True).limit(500).execute()
    return response.data


@router.get("/logs/{log_id}", response_model=FGasLogResponse)
async def get_fgas_log(log_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('fgas_logs').select('*').eq('id', log_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="F-Gas log not found")
    return response.data[0]


@router.delete("/logs/{log_id}")
async def delete_fgas_log(log_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('fgas_logs').delete().eq('id', log_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="F-Gas log not found")
    return {"message": "F-Gas log deleted"}


@router.get("/dashboard")
async def get_fgas_dashboard(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    all_assets = supabase.table('assets').select('*').execute()
    assets = all_assets.data if all_assets.data else []
    
    fgas_assets = [a for a in assets if a.get('refrigerant_type') and a.get('refrigerant_charge')]
    
    inventory_by_category = {}
    for asset in fgas_assets:
        category = asset.get('fgas_category') or 'Uncategorized'
        if category not in inventory_by_category:
            inventory_by_category[category] = {
                'count': 0,
                'total_charge_kg': 0,
                'total_co2_equivalent': 0
            }
        inventory_by_category[category]['count'] += 1
        try:
            charge = float(asset.get('refrigerant_charge', 0) or 0)
            inventory_by_category[category]['total_charge_kg'] += charge
        except (ValueError, TypeError):
            pass
        try:
            co2_eq = float(asset.get('fgas_co2_equivalent', 0) or 0)
            inventory_by_category[category]['total_co2_equivalent'] += co2_eq
        except (ValueError, TypeError):
            pass
    
    leak_check_overdue = []
    leak_check_due_soon = []
    for asset in fgas_assets:
        next_check = asset.get('fgas_next_leak_check_due')
        if next_check:
            try:
                check_date = datetime.fromisoformat(next_check.replace('Z', '+00:00'))
                if check_date <= datetime.now(timezone.utc):
                    leak_check_overdue.append(asset)
                elif check_date <= datetime.now(timezone.utc) + timedelta(days=30):
                    leak_check_due_soon.append(asset)
            except (ValueError, TypeError):
                pass
    
    recent_logs = supabase.table('fgas_logs').select('*').order('created_at', desc=True).limit(10).execute()
    
    total_refrigerant_added = 0
    total_refrigerant_recovered = 0
    total_refrigerant_lost = 0
    
    year_start = datetime(datetime.now().year, 1, 1, tzinfo=timezone.utc).isoformat()
    year_logs = supabase.table('fgas_logs').select('*').gte('created_at', year_start).execute()
    
    for log in (year_logs.data or []):
        try:
            total_refrigerant_added += float(log.get('refrigerant_added', 0) or 0)
            total_refrigerant_recovered += float(log.get('refrigerant_recovered', 0) or 0)
            total_refrigerant_lost += float(log.get('refrigerant_lost', 0) or 0)
        except (ValueError, TypeError):
            pass
    
    return {
        "total_fgas_assets": len(fgas_assets),
        "inventory_by_category": inventory_by_category,
        "leak_check_overdue_count": len(leak_check_overdue),
        "leak_check_overdue": leak_check_overdue[:10],
        "leak_check_due_soon_count": len(leak_check_due_soon),
        "leak_check_due_soon": leak_check_due_soon[:10],
        "recent_logs": recent_logs.data or [],
        "annual_summary": {
            "year": datetime.now().year,
            "refrigerant_added_kg": round(total_refrigerant_added, 3),
            "refrigerant_recovered_kg": round(total_refrigerant_recovered, 3),
            "refrigerant_lost_kg": round(total_refrigerant_lost, 3)
        }
    }


@router.get("/leak-check-due")
async def get_assets_leak_check_due(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    response = supabase.table('assets').select('*').lte('fgas_next_leak_check_due', now).execute()
    return response.data or []
