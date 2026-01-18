from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
import aiofiles

from database import supabase
from models.job import JobCreate, JobUpdate, JobResponse, JobCompletionCreate
from services.auth import get_current_user
from services.pdf import generate_job_pdf_content
from config import UPLOAD_DIR

router = APIRouter(prefix="/jobs", tags=["jobs"])


def generate_job_number():
    response = supabase.table('jobs').select('*', count='exact').execute()
    count = response.count if response.count else 0
    return f"JOB-{str(count + 1).zfill(5)}"


@router.post("", response_model=JobResponse)
async def create_job(data: JobCreate, user: dict = Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    job_number = generate_job_number()
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": job_id,
        "job_number": job_number,
        **data.model_dump(),
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "created_by": user["id"]
    }
    supabase.table('jobs').insert(doc).execute()
    
    supabase.table('job_events').insert({
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "event_type": "created",
        "user_id": user["id"],
        "timestamp": now,
        "details": {"status": "pending"}
    }).execute()
    
    return {**doc}


@router.get("", response_model=List[JobResponse])
async def get_jobs(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    engineer_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    job_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = supabase.table('jobs').select('*')
    if status:
        query = query.eq('status', status)
    if priority:
        query = query.eq('priority', priority)
    if engineer_id:
        query = query.eq('assigned_engineer_id', engineer_id)
    if customer_id:
        query = query.eq('customer_id', customer_id)
    if job_type:
        query = query.eq('job_type', job_type)
    
    response = query.order('created_at', desc=True).limit(1000).execute()
    return response.data


@router.get("/scheduled")
async def get_scheduled_jobs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = supabase.table('jobs').select('*').not_.is_('scheduled_date', 'null')
    if start_date:
        query = query.gte('scheduled_date', start_date)
    if end_date:
        query = query.lte('scheduled_date', end_date)
    
    response = query.execute()
    return response.data


@router.get("/my-jobs")
async def get_my_jobs(user: dict = Depends(get_current_user)):
    response = supabase.table('jobs').select('*').eq('assigned_engineer_id', user["id"]).in_('status', ['pending', 'in_progress', 'travelling']).order('scheduled_date').limit(100).execute()
    return response.data


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('jobs').select('*').eq('id', job_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return response.data[0]


@router.put("/{job_id}")
async def update_job(job_id: str, data: JobUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    old_job_response = supabase.table('jobs').select('*').eq('id', job_id).execute()
    if not old_job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    old_job = old_job_response.data[0]
    
    response = supabase.table('jobs').update(update_data).eq('id', job_id).execute()
    
    if data.status and data.status != old_job.get("status"):
        supabase.table('job_events').insert({
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "event_type": "status_changed",
            "user_id": user["id"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": {"old_status": old_job.get("status"), "new_status": data.status}
        }).execute()
    
    return response.data[0]


@router.delete("/{job_id}")
async def delete_job(job_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('jobs').delete().eq('id', job_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted"}


@router.get("/{job_id}/events")
async def get_job_events(job_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('job_events').select('*').eq('job_id', job_id).order('timestamp', desc=True).limit(100).execute()
    return response.data


@router.post("/{job_id}/complete")
async def complete_job(job_id: str, data: JobCompletionCreate, user: dict = Depends(get_current_user)):
    job_response = supabase.table('jobs').select('*').eq('id', job_id).execute()
    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_response.data[0]
    
    now = datetime.now(timezone.utc).isoformat()
    
    completion_doc = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        **data.model_dump(),
        "completed_by": user["id"],
        "completed_at": now
    }
    supabase.table('job_completions').insert(completion_doc).execute()
    
    supabase.table('jobs').update({"status": "completed", "updated_at": now}).eq('id', job_id).execute()
    
    for asset_id in job.get("asset_ids", []):
        asset_response = supabase.table('assets').select('*').eq('id', asset_id).execute()
        if asset_response.data:
            asset = asset_response.data[0]
            pm_months = asset.get("pm_interval_months", 6)
            next_pm = (datetime.now(timezone.utc) + timedelta(days=pm_months * 30)).isoformat()
            supabase.table('assets').update({"last_service_date": now, "next_pm_due": next_pm}).eq('id', asset_id).execute()
    
    supabase.table('job_events').insert({
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "event_type": "completed",
        "user_id": user["id"],
        "timestamp": now,
        "details": {"travel_time": data.travel_time, "time_on_site": data.time_on_site}
    }).execute()
    
    return {"message": "Job completed", "completion_id": completion_doc["id"]}


@router.get("/{job_id}/completion")
async def get_job_completion(job_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('job_completions').select('*').eq('job_id', job_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Completion not found")
    return response.data[0]


@router.post("/{job_id}/photos")
async def upload_job_photo(job_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    job_response = supabase.table('jobs').select('id').eq('id', job_id).execute()
    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_path = UPLOAD_DIR / f"{file_id}.{file_ext}"
    
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    photo_doc = {
        "id": file_id,
        "job_id": job_id,
        "filename": file.filename,
        "path": str(file_path),
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table('job_photos').insert(photo_doc).execute()
    
    return {"id": file_id, "filename": file.filename}


@router.get("/{job_id}/photos")
async def get_job_photos(job_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('job_photos').select('*').eq('job_id', job_id).limit(100).execute()
    return response.data


@router.delete("/{job_id}/photos/{photo_id}")
async def delete_job_photo(job_id: str, photo_id: str, user: dict = Depends(get_current_user)):
    photo_response = supabase.table('job_photos').select('*').eq('id', photo_id).eq('job_id', job_id).execute()
    if not photo_response.data:
        raise HTTPException(status_code=404, detail="Photo not found")
    photo = photo_response.data[0]
    
    file_path = Path(photo["path"])
    if file_path.exists():
        file_path.unlink()
    
    supabase.table('job_photos').delete().eq('id', photo_id).execute()
    return {"message": "Photo deleted"}


@router.get("/{job_id}/pdf")
async def generate_job_pdf(job_id: str, user: dict = Depends(get_current_user)):
    job_response = supabase.table('jobs').select('*').eq('id', job_id).execute()
    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_response.data[0]
    
    customer_response = supabase.table('customers').select('*').eq('id', job["customer_id"]).execute()
    customer = customer_response.data[0] if customer_response.data else None
    
    site_response = supabase.table('sites').select('*').eq('id', job["site_id"]).execute()
    site = site_response.data[0] if site_response.data else None
    
    completion_response = supabase.table('job_completions').select('*').eq('job_id', job_id).execute()
    completion = completion_response.data[0] if completion_response.data else None
    
    buffer = generate_job_pdf_content(job, customer, site, completion)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=job-{job.get('job_number', job_id)}.pdf"}
    )


checklist_router = APIRouter(prefix="/checklist-templates", tags=["checklists"])


@checklist_router.post("")
async def create_checklist_template(data: dict, user: dict = Depends(get_current_user)):
    template_id = str(uuid.uuid4())
    doc = {
        "id": template_id,
        "name": data.get("name", ""),
        "asset_type": data.get("asset_type", ""),
        "items": data.get("items", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table('checklist_templates').insert(doc).execute()
    return doc


@checklist_router.get("")
async def get_checklist_templates(asset_type: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = supabase.table('checklist_templates').select('*')
    if asset_type:
        query = query.eq('asset_type', asset_type)
    response = query.limit(100).execute()
    return response.data
