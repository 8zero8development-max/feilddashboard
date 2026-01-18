# Craven Cooling Services Ltd - Field Service Management System

## Original Problem Statement
Build a Field Service Management system for refrigeration/HVAC businesses with two apps:
- Office panel (web): dispatch, schedule, customers, quotes/invoices, reports
- Engineer app (mobile): jobs, checklists, photos, signatures, parts, offline

## User Personas
- **Admin/Owner**: Full system access, manages users, views reports, handles quotes/invoices
- **Dispatcher/Office**: Schedules jobs, manages customers/sites, creates quotes
- **Engineer**: Views assigned jobs, completes job sheets, captures signatures, logs parts
- **Customer (Portal)**: Views service history, upcoming PM schedules, invoices

## Core Requirements
- JWT-based authentication with roles
- Customer & Site management with contacts
- Asset management with PM tracking (refrigerant type, charge, intervals)
- Job management with status workflow (pending → travelling → in_progress → completed)
- Scheduling calendar with drag-drop
- Quote & Invoice creation with PDF generation
- Parts catalogue with stock tracking
- Reports dashboard with charts
- Mobile-responsive Engineer app with offline-ready design

## What's Been Implemented

### Phase 1 - MVP (January 2025)
**Backend (FastAPI + MongoDB)**
- ✅ Complete auth system with JWT tokens and role-based access
- ✅ Full CRUD for: Customers, Sites, Assets, Jobs, Quotes, Invoices, Parts, Users
- ✅ Dashboard stats API
- ✅ Reports APIs (jobs by status, jobs by engineer, PM due list)
- ✅ PDF generation for Job Reports, Quotes, and Invoices
- ✅ Job completion workflow with signature, checklist, parts tracking

**Frontend (React + TailwindCSS + shadcn/ui)**
- ✅ Professional login/register with role selection
- ✅ Dashboard with stats cards, pending jobs, PM due alerts
- ✅ Jobs list with filters (status, priority, type)
- ✅ Job detail view with timeline, assets, completion status
- ✅ Scheduler with react-big-calendar
- ✅ Customers, Sites, Assets management pages
- ✅ Quotes & Invoices with line items and PDF download
- ✅ Parts catalogue with stock alerts
- ✅ Users management
- ✅ Reports with recharts visualizations
- ✅ Engineer Mobile View with job sheet, checklist, signature capture

### Phase 2 - Enhancements (January 2025)
- ✅ **Offline Mode**: Service worker for caching, offline.html fallback page
- ✅ **Photo Upload/Display**: Job photos endpoint, upload in job detail page
- ✅ **PM Automation**: Auto-generate PM jobs for overdue assets, status dashboard
- ✅ **Customer Portal**:
  - Separate login with access codes
  - Dashboard with service overview
  - Sites and Assets views
  - Service history with engineer notes
  - Upcoming PM schedule
  - Invoices list
- ✅ **Database Migration**: Migrated from MongoDB to Supabase (PostgreSQL) for better scalability and features

## Tech Stack
- Backend: FastAPI + Supabase (PostgreSQL)
- Frontend: React 19 + TailwindCSS + shadcn/ui
- Auth: JWT with bcrypt (separate tokens for staff vs customer portal)
- PDF: ReportLab
- Calendar: react-big-calendar
- Charts: recharts
- Signature: react-signature-canvas
- Offline: Service Worker + IndexedDB ready

## Prioritized Backlog
### P0 (Critical) - DONE
- ✅ Core CRUD operations
- ✅ Job workflow
- ✅ Basic reporting
- ✅ PM automation
- ✅ Customer portal

### P1 (Important)
- [ ] Background sync for offline job completions
- [ ] Email notifications for job assignments
- [ ] Push notifications for engineers

### P2 (Nice to have)
- [ ] Map view for engineer locations
- [ ] Xero/QuickBooks integration
- [ ] Mobile push notifications
- [ ] Service certificates with digital signature verification

## Next Tasks
1. Add background sync for offline job completions
2. Implement email notifications using SendGrid/Resend
3. Add push notifications for mobile engineers
4. Create service certificate templates
