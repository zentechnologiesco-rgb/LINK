-- Create a public bucket for property images
insert into storage.buckets (id, name, public)
values ('property_images', 'property_images', true)
on conflict (id) do nothing;

-- Policy: Allow authenticated landlords to upload property images
-- Path convention: {user_id}/{property_id}/{filename}
create policy "Landlords can upload property images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow landlords to update/replace their own property images
create policy "Landlords can update their property images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'property_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow landlords to delete their own property images
create policy "Landlords can delete their property images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow everyone to view property images (public bucket)
create policy "Anyone can view property images"
on storage.objects for select
to public
using (
  bucket_id = 'property_images'
);
