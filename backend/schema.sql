-- Supabase SQL Schema for AI Meeting Assistant

-- DROP existing tables to fix any text/uuid type mismatches from previous iterations
drop table if exists public.meetings cascade;
drop table if exists public.profiles cascade;

-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  username text unique not null,
  email text unique not null,
  phone text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. Create Trigger to automatically create a profile after signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, phone, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.phone,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create an RPC to lookup email by username (Security Definer allows bypassing RLS for just this check)
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
as $$
  select email from public.profiles where username = p_username limit 1;
$$;

-- 4. Create an RPC to check if a username is available
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
as $$
  select not exists (select 1 from public.profiles where username = p_username);
$$;

-- 5. Create the meetings table
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Meeting',
  transcript text,
  summary text,
  action_items jsonb default '[]'::jsonb,
  key_decisions jsonb default '[]'::jsonb,
  source text default 'mic',           -- 'mic' | 'bot'
  platform text,                        -- 'zoom' | 'meet' | 'teams' | 'discord' | null
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on Meetings
alter table public.meetings enable row level security;

-- Strict Auth Policies: Users can only interact with their own data
create policy "Users can insert their own meetings" on public.meetings 
  for insert with check (auth.uid() = user_id);

create policy "Users can read their own meetings" on public.meetings 
  for select using (auth.uid() = user_id);

create policy "Users can update their own meetings" on public.meetings 
  for update using (auth.uid() = user_id);

create policy "Users can delete their own meetings" on public.meetings 
  for delete using (auth.uid() = user_id);
