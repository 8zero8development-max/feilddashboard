from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
from datetime import datetime, timezone

from database import supabase
from models.customer import CustomerCreate, CustomerResponse
from services.auth import get_current_user

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, user: dict = Depends(get_current_user)):
    customer_id = str(uuid.uuid4())
    doc = {
        "id": customer_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table('customers').insert(doc).execute()
    return {**doc, "id": customer_id}


@router.get("", response_model=List[CustomerResponse])
async def get_customers(user: dict = Depends(get_current_user)):
    response = supabase.table('customers').select('*').execute()
    return response.data


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('customers').select('*').eq('id', customer_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return response.data[0]


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerCreate, user: dict = Depends(get_current_user)):
    response = supabase.table('customers').update(data.model_dump()).eq('id', customer_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return response.data[0]


@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('customers').delete().eq('id', customer_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}
