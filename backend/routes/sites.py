from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from database import supabase
from models.customer import SiteCreate, SiteResponse
from services.auth import get_current_user

router = APIRouter(prefix="/sites", tags=["sites"])


@router.post("", response_model=SiteResponse)
async def create_site(data: SiteCreate, user: dict = Depends(get_current_user)):
    site_id = str(uuid.uuid4())
    doc = {
        "id": site_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table('sites').insert(doc).execute()
    return {**doc, "id": site_id}


@router.get("", response_model=List[SiteResponse])
async def get_sites(customer_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = supabase.table('sites').select('*')
    if customer_id:
        query = query.eq('customer_id', customer_id)
    response = query.execute()
    return response.data


@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(site_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('sites').select('*').eq('id', site_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Site not found")
    return response.data[0]


@router.put("/{site_id}", response_model=SiteResponse)
async def update_site(site_id: str, data: SiteCreate, user: dict = Depends(get_current_user)):
    response = supabase.table('sites').update(data.model_dump()).eq('id', site_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Site not found")
    return response.data[0]


@router.delete("/{site_id}")
async def delete_site(site_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('sites').delete().eq('id', site_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Site not found")
    return {"message": "Site deleted"}
