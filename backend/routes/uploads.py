from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from io import BytesIO
import uuid
from datetime import datetime, timezone
import aiofiles
from pathlib import Path

from database import supabase
from services.auth import get_current_user
from config import UPLOAD_DIR

router = APIRouter(prefix="/upload", tags=["uploads"])


@router.post("/photo")
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
    supabase.table('photos').insert(photo_doc).execute()
    
    return {"id": file_id, "filename": file.filename}


photos_router = APIRouter(prefix="/photos", tags=["photos"])


@photos_router.get("/{photo_id}")
async def get_photo(photo_id: str):
    response = supabase.table('photos').select('*').eq('id', photo_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Photo not found")
    photo = response.data[0]
    
    file_path = Path(photo["path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    async with aiofiles.open(file_path, "rb") as f:
        content = await f.read()
    
    return StreamingResponse(BytesIO(content), media_type="image/jpeg")
