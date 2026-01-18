from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
from datetime import datetime, timezone

from database import supabase
from models.auth import UserCreate, UserLogin, UserResponse
from services.auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(data: UserCreate):
    response = supabase.table('users').select('*').eq('email', data.email).execute()
    if response.data:
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
    supabase.table('users').insert(user_doc).execute()
    token = create_token(user_id, data.role)
    return {"token": token, "user": {"id": user_id, "email": data.email, "name": data.name, "role": data.role}}


@router.post("/login")
async def login(data: UserLogin):
    response = supabase.table('users').select('*').eq('email', data.email).execute()
    if not response.data or not verify_password(data.password, response.data[0]["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = response.data[0]
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}


users_router = APIRouter(prefix="/users", tags=["users"])


@users_router.get("", response_model=List[UserResponse])
async def get_users(user: dict = Depends(get_current_user)):
    response = supabase.table('users').select('id, email, name, role, created_at').execute()
    return response.data


@users_router.get("/engineers")
async def get_engineers(user: dict = Depends(get_current_user)):
    response = supabase.table('users').select('id, email, name, role, created_at').eq('role', 'engineer').execute()
    return response.data
