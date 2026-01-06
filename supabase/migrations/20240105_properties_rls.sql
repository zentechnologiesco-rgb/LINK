-- RLS policies for properties table to allow landlords to manage their own properties

-- Landlords can insert their own properties
CREATE POLICY "Landlords can insert their own properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = landlord_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('landlord', 'admin')
  )
);

-- Landlords can update their own properties
CREATE POLICY "Landlords can update their own properties"
ON properties FOR UPDATE
TO authenticated
USING (
  auth.uid() = landlord_id
)
WITH CHECK (
  auth.uid() = landlord_id
);

-- Landlords can delete their own properties
CREATE POLICY "Landlords can delete their own properties"
ON properties FOR DELETE
TO authenticated
USING (
  auth.uid() = landlord_id
);

-- Admins can manage all properties
CREATE POLICY "Admins can manage all properties"
ON properties FOR ALL
TO authenticated
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
