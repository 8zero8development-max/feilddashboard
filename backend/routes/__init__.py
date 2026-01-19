from routes.auth import router as auth_router, users_router
from routes.customers import router as customers_router
from routes.sites import router as sites_router
from routes.assets import router as assets_router
from routes.jobs import router as jobs_router, checklist_router
from routes.quotes import router as quotes_router
from routes.invoices import router as invoices_router
from routes.parts import router as parts_router
from routes.uploads import router as uploads_router, photos_router
from routes.reports import router as reports_router
from routes.pm import router as pm_router
from routes.portal import router as portal_router
from routes.fgas import router as fgas_router

__all__ = [
    "auth_router", "users_router",
    "customers_router",
    "sites_router",
    "assets_router",
    "jobs_router", "checklist_router",
    "quotes_router",
    "invoices_router",
    "parts_router",
    "uploads_router", "photos_router",
    "reports_router",
    "pm_router",
    "portal_router",
    "fgas_router",
]
