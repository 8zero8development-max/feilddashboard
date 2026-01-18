# Craven Cooling Services - Field Service Management

## Overview
A field service management application for Craven Cooling Services Ltd. The frontend is built with React (Create React App with CRACO) and the backend is a FastAPI Python server using Supabase.

## Project Structure
- `frontend/` - React application (CRA with CRACO, Tailwind CSS, shadcn/ui components)
- `backend/` - FastAPI Python server
  - `server.py` - Main API server
  - `requirements.txt` - Python dependencies
  - `supabase_schema.sql` - Database schema
- `supabase/` - Supabase configuration

## Running the Application

### Frontend (Development)
The frontend runs on port 5000 with the `Frontend` workflow:
```bash
cd frontend && yarn start
```

### Backend
The backend requires Supabase credentials. Run with:
```bash
cd backend && uvicorn server:app --host localhost --port 8000
```

## Environment Variables Required
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/public key
- `JWT_SECRET` - Secret key for JWT token generation (optional, has default)

## Deployment
The project is configured for static deployment. The frontend builds to `frontend/build/`.

## Theming
The application supports dark and light modes with a toggle button:
- Theme preference is stored in localStorage under the key `craven-theme`
- Default theme is dark mode
- Toggle button available on login page (top-right) and in main layout header
- Uses CSS variables via Tailwind for consistent theming across all components

## Recent Changes
- January 18, 2026: Added dark/light theme support
  - Created ThemeProvider component for theme state management
  - Added theme toggle to Layout and Login pages
  - Updated CSS with dark mode variants for badges, scrollbars, and calendar
  - Added smooth transitions for theme switching
  - Modernized styling with glassmorphism effects and better shadows

- January 18, 2026: Fixed deployment configuration
  - Converted backend from relative to absolute imports for uvicorn compatibility
  - Configured autoscale deployment with backend serving frontend static files
  - Set up API proxy for development environment

- January 18, 2026: Initial setup in Replit environment
  - Configured CRACO to allow all hosts for Replit proxy
  - Set frontend to run on 0.0.0.0:5000
  - Installed Node.js 20 and Python 3.11
  - Simplified Python requirements to resolve dependency conflicts
