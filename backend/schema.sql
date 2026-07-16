-- Supabase SQL Schema for AI Meeting Assistant

-- Create the meetings table
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null default 'Untitled Meeting',
  transcript text,
  summary text,
  action_items jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
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
