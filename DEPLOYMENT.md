# Deployment Guide

## Overview

This Field Service Management application consists of:
- **Frontend**: React app (Create React App with CRACO)
- **Backend**: Python FastAPI server
- **Database**: Supabase PostgreSQL

## Frontend Deployment

### Build the Frontend

```bash
npm install
npm run build
```

This will:
1. Install dependencies in the `frontend/` directory
2. Create a production build in `frontend/build/`

### Environment Variables

Set the following environment variable before building:

```bash
export REACT_APP_BACKEND_URL=https://your-backend-url.com
npm run build
```

If not set, it defaults to `http://localhost:8000`.

### Serve the Build

The `frontend/build/` directory contains static files that can be served by any static file server:

- Nginx
- Apache
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any CDN

## Backend Deployment

### Requirements

- Python 3.10+
- pip

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_random_secret_key
STRIPE_SECRET_KEY=your_stripe_key (optional)
```

### Run the Server

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

For production, use a process manager like:
- **Gunicorn**: `gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker`
- **PM2**: `pm2 start "uvicorn server:app --host 0.0.0.0 --port 8000"`
- **Systemd**: Create a service file

## Database Setup

The Supabase schema is defined in:
- `supabase/migrations/20260118161907_create_field_service_management_schema.sql`

Run this migration in your Supabase project dashboard or via the Supabase CLI.

## CORS Configuration

The backend is configured to accept requests from any origin. For production, update the CORS settings in `backend/server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Update this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Deployment Platforms

### Vercel (Frontend)

1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `frontend/build`
4. Add environment variable: `REACT_APP_BACKEND_URL`

### Railway/Render (Backend)

1. Connect your GitHub repo
2. Set start command: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
3. Add all environment variables
4. Set root directory: `backend`

### Docker (Full Stack)

Create `Dockerfile` in root:

```dockerfile
FROM node:18 AS frontend
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
RUN yarn build

FROM python:3.11
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/ ./
COPY --from=frontend /app/build /app/static
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Health Checks

- Frontend: Serve on port 3000 (dev) or via static server (prod)
- Backend: `GET /api/health` returns `{"status": "healthy"}`

## Troubleshooting

### Build fails with "package.json not found"

Ensure you're running `npm install` and `npm run build` from the **root** directory, not the `frontend/` directory. The root `package.json` delegates to the frontend.

### Backend can't connect to Supabase

Verify your environment variables are set correctly and the Supabase project is accessible.

### CORS errors in production

Update the `allow_origins` in the backend CORS middleware to include your frontend domain.
