# Craven Cooling Services Ltd - Field Service Management System

![Craven Cooling Logo](https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png)

A comprehensive Field Service Management (FSM) system built for refrigeration and HVAC businesses. Includes an office management panel and a mobile-responsive engineer app.

## Features

### Office Panel (Web)
- **Dashboard** - Real-time overview of jobs, PM due alerts, outstanding invoices
- **Job Management** - Create, assign, schedule, and track service jobs
- **Scheduler** - Calendar view with drag-and-drop job scheduling
- **Customer & Site Management** - Full CRM with multiple sites per customer
- **Asset Management** - Track equipment with PM intervals, refrigerant data, service history
- **Quotes & Invoices** - Create line-item quotes/invoices with PDF generation
- **Parts Catalogue** - Inventory management with low stock alerts
- **Reports** - Visual analytics on jobs, engineers, and PM status
- **PM Automation** - Auto-generate PM jobs when assets are due
- **Customer Portal Access** - Grant customers access to view their service history

### Engineer Mobile App
- **My Jobs** - View assigned jobs with priorities and status
- **Job Sheet** - Complete checklists, log parts, capture photos
- **Signature Capture** - Customer sign-off on completed work
- **Offline Ready** - Service worker caching for low-connectivity areas

### Customer Portal
- **Service History** - View all completed service visits with engineer notes
- **PM Schedule** - See upcoming and overdue preventive maintenance
- **Assets** - View all equipment being maintained
- **Invoices** - Access billing history

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Frontend | React 19 + TailwindCSS |
| UI Components | shadcn/ui |
| Authentication | JWT with bcrypt |
| PDF Generation | ReportLab |
| Calendar | react-big-calendar |
| Charts | recharts |
| Signature | react-signature-canvas |

## Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI application with all endpoints
│   ├── requirements.txt   # Python dependencies
│   ├── .env              # Environment variables
│   └── uploads/          # Photo storage
├── frontend/
│   ├── src/
│   │   ├── pages/        # React page components
│   │   ├── components/   # Reusable UI components
│   │   ├── App.js        # Main app with routing
│   │   └── index.css     # Global styles
│   ├── public/
│   │   ├── service-worker.js  # Offline caching
│   │   └── offline.html       # Offline fallback
│   └── package.json
└── memory/
    └── PRD.md            # Product requirements document
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}` - Get customer details
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Sites
- `GET /api/sites` - List all sites (optional `?customer_id=`)
- `POST /api/sites` - Create site
- `GET /api/sites/{id}` - Get site details
- `PUT /api/sites/{id}` - Update site
- `DELETE /api/sites/{id}` - Delete site

### Assets
- `GET /api/assets` - List all assets (optional `?site_id=`)
- `GET /api/assets/pm-due` - List assets with PM overdue
- `POST /api/assets` - Create asset
- `GET /api/assets/{id}` - Get asset details
- `GET /api/assets/{id}/history` - Get asset service history
- `PUT /api/assets/{id}` - Update asset
- `DELETE /api/assets/{id}` - Delete asset

### Jobs
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/scheduled` - Get scheduled jobs for calendar
- `GET /api/jobs/my-jobs` - Get jobs assigned to current user
- `POST /api/jobs` - Create job
- `GET /api/jobs/{id}` - Get job details
- `PUT /api/jobs/{id}` - Update job
- `DELETE /api/jobs/{id}` - Delete job
- `POST /api/jobs/{id}/complete` - Complete job with notes/signature
- `GET /api/jobs/{id}/events` - Get job audit timeline
- `GET /api/jobs/{id}/pdf` - Download job report PDF
- `POST /api/jobs/{id}/photos` - Upload photo to job
- `GET /api/jobs/{id}/photos` - List job photos
- `DELETE /api/jobs/{id}/photos/{photo_id}` - Delete photo

### Quotes
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/{id}` - Get quote details
- `PUT /api/quotes/{id}/status` - Update quote status
- `DELETE /api/quotes/{id}` - Delete quote
- `GET /api/quotes/{id}/pdf` - Download quote PDF

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}` - Get invoice details
- `PUT /api/invoices/{id}/status` - Update invoice status
- `DELETE /api/invoices/{id}` - Delete invoice
- `GET /api/invoices/{id}/pdf` - Download invoice PDF

### Parts
- `GET /api/parts` - List parts catalogue
- `POST /api/parts` - Create part
- `GET /api/parts/{id}` - Get part details
- `PUT /api/parts/{id}` - Update part
- `DELETE /api/parts/{id}` - Delete part

### PM Automation
- `GET /api/pm/status` - Get PM automation status
- `POST /api/pm/generate-jobs` - Auto-generate PM jobs for overdue assets

### Customer Portal
- `POST /api/portal/create-access` - Create portal access for customer
- `POST /api/portal/login` - Customer portal login
- `GET /api/portal/dashboard` - Customer dashboard stats
- `GET /api/portal/sites` - Customer's sites
- `GET /api/portal/assets` - Customer's assets
- `GET /api/portal/service-history` - Completed jobs
- `GET /api/portal/upcoming-pm` - PM schedule
- `GET /api/portal/invoices` - Customer invoices

### Reports
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports/jobs-by-status` - Jobs grouped by status
- `GET /api/reports/jobs-by-engineer` - Jobs per engineer
- `GET /api/reports/pm-due-list` - Assets with PM due

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access, user management |
| **Dispatcher** | Job scheduling, customers, quotes, invoices |
| **Engineer** | Assigned jobs, job completion, mobile app |
| **Customer (Portal)** | Service history, PM schedule, invoices (read-only) |

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=craven_cooling
JWT_SECRET=your-secret-key
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## Job Workflow

```
[Created] → [Pending] → [Travelling] → [In Progress] → [Completed]
                ↓
           [Cancelled]
```

## PM Automation Flow

1. Assets have `pm_interval_months` (3, 6, or 12) and `next_pm_due` date
2. When a PM job is completed, `next_pm_due` auto-updates
3. Dashboard shows PM due alerts
4. "Generate PM Jobs" creates service jobs for all overdue assets
5. Auto-generated jobs are marked with `auto_generated: true`

## Customer Portal Access

1. Admin goes to **Customer Portal** in sidebar
2. Click **Grant Portal Access**
3. Select customer, enter contact name and email
4. System generates 8-character access code (shown once)
5. Share portal URL and access code with customer
6. Customer logs in at `/portal` with email + access code

## Screenshots

- **Dashboard**: Stats overview with pending jobs and PM alerts
- **Jobs**: Filterable list with status badges
- **Scheduler**: Weekly calendar view
- **Engineer App**: Dark theme mobile-optimized interface
- **Customer Portal**: Clean read-only service history view

## License

Proprietary - Craven Cooling Services Ltd

---

Built with ❄️ by Emergent
