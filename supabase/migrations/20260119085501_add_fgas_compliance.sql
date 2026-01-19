-- F-Gas Compliance Migration
-- Adds F-Gas tracking fields to assets table and creates fgas_logs table
-- For UK F-Gas regulatory compliance

-- Add F-Gas compliance fields to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS fgas_category VARCHAR DEFAULT '';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS fgas_co2_equivalent DECIMAL(10,2);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS fgas_certified_technician VARCHAR DEFAULT '';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS fgas_leak_check_interval INTEGER DEFAULT 12;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS fgas_last_leak_check VARCHAR;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS fgas_next_leak_check_due VARCHAR;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS fgas_notes TEXT DEFAULT '';

-- Create index for leak check due dates
CREATE INDEX IF NOT EXISTS idx_assets_fgas_next_leak_check_due ON assets(fgas_next_leak_check_due);

-- F-Gas Logs table (tracks all F-Gas related activities for compliance)
CREATE TABLE IF NOT EXISTS fgas_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    log_type VARCHAR NOT NULL,
    refrigerant_added DECIMAL(10,3),
    refrigerant_recovered DECIMAL(10,3),
    refrigerant_lost DECIMAL(10,3),
    technician_certification VARCHAR DEFAULT '',
    leak_test_result VARCHAR DEFAULT '',
    test_pressure DECIMAL(10,2),
    test_method VARCHAR DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fgas_logs
CREATE INDEX IF NOT EXISTS idx_fgas_logs_asset_id ON fgas_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_fgas_logs_job_id ON fgas_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_fgas_logs_created_at ON fgas_logs(created_at);
