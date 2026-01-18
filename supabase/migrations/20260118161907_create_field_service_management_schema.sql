/*
  # Field Service Management System - Complete Schema

  ## Overview
  Complete database schema for Craven Cooling Services Field Service Management System.
  Supports customer management, job scheduling, asset tracking, preventive maintenance,
  quotes, invoices, parts management, and customer portal access.

  ## New Tables Created

  ### Core Tables
  1. **users** - System users (admin, dispatcher, engineers)
     - id, email, password_hash, name, role, created_at
     - Roles: admin, dispatcher, engineer

  2. **customers** - Customer companies
     - id, company_name, billing_address, phone, email, notes, created_at

  3. **sites** - Customer service locations
     - id, customer_id (FK), name, address, access_notes, key_location, opening_hours, contact_name, contact_phone, created_at

  4. **assets** - Equipment/systems at sites
     - id, site_id (FK), name, make, model, serial_number, install_date, warranty_expiry
     - refrigerant_type, refrigerant_charge, pm_interval_months, last_service_date, next_pm_due, notes, created_at

  ### Job Management
  5. **jobs** - Service jobs and work orders
     - id, job_number, customer_id (FK), site_id (FK), asset_ids (JSONB), job_type, priority, status
     - description, assigned_engineer_id (FK), scheduled_date, scheduled_time, estimated_duration
     - sla_hours, created_at, updated_at, created_by, auto_generated

  6. **job_events** - Job audit trail
     - id, job_id (FK), event_type, user_id, timestamp, details (JSONB)

  7. **job_completions** - Job completion records
     - id, job_id (FK), engineer_notes, parts_used (JSONB), travel_time, time_on_site
     - customer_signature, checklist_items (JSONB), photos (JSONB), completed_by, completed_at

  ### Financial
  8. **quotes** - Customer quotations
     - id, quote_number, customer_id (FK), site_id (FK), job_id (FK), lines (JSONB)
     - subtotal, vat, total, status, notes, valid_days, valid_until, created_at

  9. **invoices** - Customer invoices
     - id, invoice_number, customer_id (FK), site_id (FK), job_id (FK), quote_id (FK), lines (JSONB)
     - subtotal, vat, total, status, notes, due_days, due_date, created_at

  ### Inventory & Templates
  10. **parts** - Parts catalogue
      - id, name, part_number, description, unit_price, stock_quantity, min_stock_level, created_at

  11. **checklist_templates** - Job checklist templates
      - id, name, asset_type, items (JSONB), created_at

  ### Media
  12. **photos** - General photo uploads
      - id, filename, path, uploaded_by, uploaded_at

  13. **job_photos** - Job-specific photos
      - id, job_id (FK), filename, path, uploaded_by, uploaded_at

  ### Customer Portal
  14. **customer_portal** - Customer portal access
      - id, customer_id (FK), email, contact_name, access_code_hash, created_at, last_login, active

  ## Performance
  - Indexes on all foreign keys
  - Indexes on frequently queried fields (status, dates, priority)

  ## Security Notes
  - All tables created with IF NOT EXISTS for safe re-runs
  - Password hashes stored using bcrypt
  - RLS not enabled by default (handled at application level via JWT)
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'engineer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR NOT NULL,
    billing_address TEXT DEFAULT '',
    phone VARCHAR DEFAULT '',
    email VARCHAR DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    address TEXT NOT NULL,
    access_notes TEXT DEFAULT '',
    key_location VARCHAR DEFAULT '',
    opening_hours VARCHAR DEFAULT '',
    contact_name VARCHAR DEFAULT '',
    contact_phone VARCHAR DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    make VARCHAR DEFAULT '',
    model VARCHAR DEFAULT '',
    serial_number VARCHAR DEFAULT '',
    install_date VARCHAR DEFAULT '',
    warranty_expiry VARCHAR DEFAULT '',
    refrigerant_type VARCHAR DEFAULT '',
    refrigerant_charge VARCHAR DEFAULT '',
    pm_interval_months INTEGER DEFAULT 6,
    last_service_date VARCHAR,
    next_pm_due VARCHAR,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number VARCHAR UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    asset_ids JSONB DEFAULT '[]',
    job_type VARCHAR NOT NULL,
    priority VARCHAR DEFAULT 'medium',
    status VARCHAR DEFAULT 'pending',
    description TEXT NOT NULL,
    assigned_engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date VARCHAR,
    scheduled_time VARCHAR,
    estimated_duration INTEGER DEFAULT 60,
    sla_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR,
    auto_generated BOOLEAN DEFAULT FALSE
);

-- Job Events table (audit trail)
CREATE TABLE IF NOT EXISTS job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    event_type VARCHAR NOT NULL,
    user_id VARCHAR,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

-- Job Completions table
CREATE TABLE IF NOT EXISTS job_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    engineer_notes TEXT,
    parts_used JSONB DEFAULT '[]',
    travel_time INTEGER DEFAULT 0,
    time_on_site INTEGER DEFAULT 0,
    customer_signature TEXT,
    checklist_items JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    completed_by VARCHAR,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    lines JSONB DEFAULT '[]',
    subtotal DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    status VARCHAR DEFAULT 'draft',
    notes TEXT DEFAULT '',
    valid_days INTEGER DEFAULT 30,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    lines JSONB DEFAULT '[]',
    subtotal DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    status VARCHAR DEFAULT 'unpaid',
    notes TEXT DEFAULT '',
    due_days INTEGER DEFAULT 30,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts table
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    part_number VARCHAR NOT NULL,
    description TEXT DEFAULT '',
    unit_price DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    uploaded_by VARCHAR,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Photos table
CREATE TABLE IF NOT EXISTS job_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    filename VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    uploaded_by VARCHAR,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    asset_type VARCHAR DEFAULT '',
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Portal table
CREATE TABLE IF NOT EXISTS customer_portal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    contact_name VARCHAR NOT NULL,
    access_code_hash VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sites_customer_id ON sites(customer_id);
CREATE INDEX IF NOT EXISTS idx_assets_site_id ON assets(site_id);
CREATE INDEX IF NOT EXISTS idx_assets_next_pm_due ON assets(next_pm_due);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_site_id ON jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_engineer_id ON jobs(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_completions_job_id ON job_completions(job_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_customer_id ON customer_portal(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_email ON customer_portal(email);
