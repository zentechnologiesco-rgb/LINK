-- Inquiries Policies
CREATE POLICY "Tenants can create inquiries"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can view their own inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
    auth.uid() = tenant_id OR 
    auth.uid() = landlord_id
);

-- Messages Policies
CREATE POLICY "Users can create messages in their inquiries"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM inquiries i
        WHERE i.id = inquiry_id
        AND (i.tenant_id = auth.uid() OR i.landlord_id = auth.uid())
    )
);

CREATE POLICY "Users can view messages in their inquiries"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM inquiries i
        WHERE i.id = inquiry_id
        AND (i.tenant_id = auth.uid() OR i.landlord_id = auth.uid())
    )
);
