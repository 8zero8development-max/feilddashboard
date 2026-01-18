from fastapi import FastAPI, APIRouter, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from datetime import datetime, timezone

from config import FRONTEND_BUILD_DIR
from database import supabase
from services.auth import get_current_user
from services.ai import summarize_notes
from routes import (
    auth_router,
    users_router,
    customers_router,
    sites_router,
    assets_router,
    jobs_router,
    checklist_router,
    quotes_router,
    invoices_router,
    parts_router,
    uploads_router,
    photos_router,
    reports_router,
    pm_router,
    portal_router,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Craven Cooling Services FSM")
api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(customers_router)
api_router.include_router(sites_router)
api_router.include_router(assets_router)
api_router.include_router(jobs_router)
api_router.include_router(checklist_router)
api_router.include_router(quotes_router)
api_router.include_router(invoices_router)
api_router.include_router(parts_router)
api_router.include_router(uploads_router)
api_router.include_router(photos_router)
api_router.include_router(reports_router)
api_router.include_router(pm_router)
api_router.include_router(portal_router)


@api_router.post("/ai/summarize-notes")
async def ai_summarize_notes(data: dict, user: dict = Depends(get_current_user)):
    notes = data.get("notes", "")
    provider = data.get("provider", "openai")
    summary = await summarize_notes(notes, provider)
    return {"summary": summary}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_BUILD_DIR / "static")), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_BUILD_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_BUILD_DIR / "index.html")
