-- Add property approval workflow columns
-- Properties now require admin approval before they can be listed

-- Add approval status column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status TEXT 
  DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval-related timestamps
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add admin notes for rejection reasons
ALTER TABLE properties ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update the is_available default to false (unlisted by default)
-- New properties should be unlisted until approved and manually listed
ALTER TABLE properties ALTER COLUMN is_available SET DEFAULT FALSE;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON properties(approval_status);

-- RLS policy for admins to update approval status
CREATE POLICY "Admins can update property approval status"
ON properties FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
