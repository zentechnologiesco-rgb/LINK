-- Create a new private bucket for verification documents
insert into storage.buckets (id, name, public)
values ('verification_documents', 'verification_documents', false);

-- Policy: Allow authenticated users to upload their own documents
-- Path convention: {user_id}/{filename}
create policy "Users can upload their own verification documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'verification_documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view their own documents
create policy "Users can view their own verification documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'verification_documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow admins to view all documents
-- Assuming admins are identified by a claim or a profile lookup. 
-- For now, relying on the fact that admins will use the service role key or 
-- we can add a specific policy if admins are just authenticated users with a role in public.profiles.
-- Let's make a robust policy joining with profiles table if possible, or just keep it simple for now.
-- Since this is 'storage.objects', joining with 'public.profiles' might be tricky due to permissions.
-- A common pattern is to let the dashboard (using service key) fetch these, OR:

create policy "Admins can view all verification documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'verification_documents' and
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  )
);
