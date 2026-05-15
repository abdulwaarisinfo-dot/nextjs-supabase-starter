-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

-- Shop profiles table
create table public.shop_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  shop_name text not null,
  address text default '',
  phone text default '',
  created_at timestamptz default now()
);

-- Bills table
create table public.bills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  bill_number text not null,
  customer_name text default '',
  customer_phone text default '',
  items jsonb not null default '[]',
  subtotal numeric(12,2) default 0,
  discount_total numeric(12,2) default 0,
  total numeric(12,2) default 0,
  note text default '',
  created_at timestamptz default now()
);

-- Row Level Security: each user only sees their own data
alter table public.shop_profiles enable row level security;
alter table public.bills enable row level security;

create policy "Users can manage own profile"
  on public.shop_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own bills"
  on public.bills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
