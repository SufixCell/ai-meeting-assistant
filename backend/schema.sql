-- Supabase SQL Schema for AI Meeting Assistant

-- Create the meetings table
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  title text not null default 'Untitled Meeting',
  transcript text,
  summary text,
  action_items jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.meetings enable row level security;

-- Create a policy that allows anyone to insert (for MVP testing)
-- In production, you would restrict this to authenticated users only using `auth.uid() = user_id`
create policy "Allow public inserts" on public.meetings 
  for insert with check (true);

-- Create a policy that allows anyone to read their own meetings
create policy "Allow public reads" on public.meetings 
  for select using (true);

-- Create a policy that allows anyone to update their own meetings
create policy "Allow public updates" on public.meetings 
  for update using (true);

-- Create a policy that allows anyone to delete their own meetings
create policy "Allow public deletes" on public.meetings 
  for delete using (true);
