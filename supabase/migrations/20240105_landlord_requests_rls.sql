-- Enable RLS for landlord_requests (already enabled in schema, but good practice to be safe or if re-running)
alter table landlord_requests enable row level security;

-- Policy: Users can insert their own requests
create policy "Users can submit landlord requests"
on landlord_requests for insert
to authenticated
with check (
  auth.uid() = user_id
);

-- Policy: Users can view their own requests
create policy "Users can view their own landlord requests"
on landlord_requests for select
to authenticated
using (
  auth.uid() = user_id
);

-- Policy: Admins can view all requests
create policy "Admins can view all landlord requests"
on landlord_requests for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Policy: Admins can update requests (approve/reject)
create policy "Admins can update landlord requests"
on landlord_requests for update
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
