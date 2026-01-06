-- Migration: Add lease document management columns
-- Run this migration on your Supabase database

-- Add new columns to leases table
ALTER TABLE leases ADD COLUMN IF NOT EXISTS lease_document JSONB;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS tenant_documents JSONB;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS tenant_signature_data TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS landlord_signature_data TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS landlord_notes TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update status constraint to include new statuses
ALTER TABLE leases DROP CONSTRAINT IF EXISTS leases_status_check;
ALTER TABLE leases ADD CONSTRAINT leases_status_check 
  CHECK (status IN ('draft', 'sent_to_tenant', 'tenant_signed', 'approved', 'rejected', 'revision_requested', 'expired', 'terminated'));

-- Migrate existing 'pending_signature' to 'sent_to_tenant' and 'active' to 'approved'
UPDATE leases SET status = 'sent_to_tenant' WHERE status = 'pending_signature';
UPDATE leases SET status = 'approved' WHERE status = 'active';

-- Create storage bucket for lease documents (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lease_documents', 'lease_documents', false);

-- RLS Policies for lease_documents bucket
-- CREATE POLICY "Users can upload lease documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'lease_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own lease documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'lease_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Landlords can view tenant lease documents"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'lease_documents' 
--   AND EXISTS (
--     SELECT 1 FROM leases 
--     WHERE leases.landlord_id = auth.uid() 
--     AND leases.tenant_id::text = (storage.foldername(name))[1]
--   )
-- );

-- Add RLS policies for leases
CREATE POLICY "Landlords can view their own leases"
ON leases FOR SELECT
USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view their own leases"
ON leases FOR SELECT
USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can insert leases"
ON leases FOR INSERT
WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their leases"
ON leases FOR UPDATE
USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can update leases they are signing"
ON leases FOR UPDATE
USING (auth.uid() = tenant_id AND status IN ('sent_to_tenant', 'revision_requested'));
