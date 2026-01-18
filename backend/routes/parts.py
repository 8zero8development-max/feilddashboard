from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
from datetime import datetime, timezone

from database import supabase
from models.invoice import PartCreate, PartResponse
from services.auth import get_current_user

router = APIRouter(prefix="/parts", tags=["parts"])


@router.post("", response_model=PartResponse)
async def create_part(data: PartCreate, user: dict = Depends(get_current_user)):
    part_id = str(uuid.uuid4())
    doc = {
        "id": part_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table('parts').insert(doc).execute()
    return doc


@router.get("", response_model=List[PartResponse])
async def get_parts(user: dict = Depends(get_current_user)):
    response = supabase.table('parts').select('*').limit(1000).execute()
    return response.data


@router.get("/{part_id}", response_model=PartResponse)
async def get_part(part_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('parts').select('*').eq('id', part_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Part not found")
    return response.data[0]


@router.put("/{part_id}", response_model=PartResponse)
async def update_part(part_id: str, data: PartCreate, user: dict = Depends(get_current_user)):
    response = supabase.table('parts').update(data.model_dump()).eq('id', part_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Part not found")
    return response.data[0]


@router.delete("/{part_id}")
async def delete_part(part_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('parts').delete().eq('id', part_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Part not found")
    return {"message": "Part deleted"}
