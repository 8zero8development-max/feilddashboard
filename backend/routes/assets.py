from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

from database import supabase
from models.asset import AssetCreate, AssetResponse
from services.auth import get_current_user

router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("", response_model=AssetResponse)
async def create_asset(data: AssetCreate, user: dict = Depends(get_current_user)):
    asset_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    next_pm_due = None
    if data.install_date:
        try:
            install = datetime.fromisoformat(data.install_date.replace('Z', '+00:00'))
            next_pm_due = (install + timedelta(days=data.pm_interval_months * 30)).isoformat()
        except ValueError:
            pass
    
    fgas_next_leak_check_due = None
    if data.install_date and data.fgas_leak_check_interval:
        try:
            install = datetime.fromisoformat(data.install_date.replace('Z', '+00:00'))
            fgas_next_leak_check_due = (install + timedelta(days=data.fgas_leak_check_interval * 30)).isoformat()
        except ValueError:
            pass
    
    doc = {
        "id": asset_id,
        **data.model_dump(),
        "last_service_date": None,
        "next_pm_due": next_pm_due,
        "fgas_last_leak_check": None,
        "fgas_next_leak_check_due": fgas_next_leak_check_due,
        "created_at": now.isoformat()
    }
    supabase.table('assets').insert(doc).execute()
    return {**doc, "id": asset_id}


@router.get("", response_model=List[AssetResponse])
async def get_assets(site_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = supabase.table('assets').select('*')
    if site_id:
        query = query.eq('site_id', site_id)
    response = query.execute()
    return response.data


@router.get("/pm-due")
async def get_assets_pm_due(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    response = supabase.table('assets').select('*').lte('next_pm_due', now).execute()
    return response.data


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('assets').select('*').eq('id', asset_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return response.data[0]


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, data: AssetCreate, user: dict = Depends(get_current_user)):
    response = supabase.table('assets').update(data.model_dump()).eq('id', asset_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return response.data[0]


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('assets').delete().eq('id', asset_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted"}


@router.get("/{asset_id}/history")
async def get_asset_history(asset_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('jobs').select('*').contains('asset_ids', [asset_id]).order('created_at', desc=True).limit(100).execute()
    return response.data
