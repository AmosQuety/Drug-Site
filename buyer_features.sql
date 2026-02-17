-- Create Favorites Table
create table public."Favorites" (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  drug_id uuid references public."Drugs"(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, drug_id)
);

-- Create SupplierFollows Table
create table public."SupplierFollows" (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references auth.users(id) not null,
  supplier_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(buyer_id, supplier_id)
);

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
