-- Promote user to Admin role
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = '';


-- Update WideSpectrum rows to match their actual profile info
UPDATE "public"."Drugs" 
SET 
  wholesaler_name = 'AIVEEN WHOLESALE PHARMACY', -- Match the name in metadata
  city = 'Mbarara',                -- Match the city in metadata
  contact_method = '0710101000'    -- Match the phone in metadata
WHERE user_id = '6f3d2524-df9d-4c95-abf6-c7a4b0a2deb7';






-- Enable RLS
alter table public."Favorites" enable row level security;
alter table public."SupplierFollows" enable row level security;

-- Policies for Favorites
create policy "Users can view their own favorites"
  on public."Favorites" for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public."Favorites" for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public."Favorites" for delete
  using (auth.uid() = user_id);

-- Policies for SupplierFollows
create policy "Users can view who they follow"
  on public."SupplierFollows" for select
  using (auth.uid() = buyer_id);

create policy "Users can follow suppliers"
  on public."SupplierFollows" for insert
  with check (auth.uid() = buyer_id);

create policy "Users can unfollow suppliers"
  on public."SupplierFollows" for delete
  using (auth.uid() = buyer_id);