-- Supabase Schema for Craven Cooling FSM
-- Run this in your Supabase SQL Editor to create all required tables

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

-- Enable Row Level Security (optional, recommended for production)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_completions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_portal ENABLE ROW LEVEL SECURITY;
