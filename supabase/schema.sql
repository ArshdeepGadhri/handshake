-- Enable pgvector extension for semantic search
create extension if not exists vector;

-- USERS TABLE
-- Handled by Supabase Auth, but we can extend with a public.users table if needed.
-- Using public.profiles for extended user data.
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONTACTS TABLE
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  job_title text,
  website text,
  linkedin_url text,
  avatar_url text,
  conference_name text,
  location text,
  notes text,
  follow_up_status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INTERACTIONS TABLE (for notes, AI summaries, email generation)
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  meeting_notes text,
  ai_summary text,
  followup_email text,
  next_followup_date timestamp with time zone,
  embedding vector(1536), -- For OpenAI embeddings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SCANS TABLE (for business card uploads)
create table public.scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete set null,
  image_url text not null,
  raw_ocr_text text,
  parsed_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) Policies
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;
alter table public.scans enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Contacts Policies
create policy "Users can view own contacts" on public.contacts for select using (auth.uid() = user_id);
create policy "Users can insert own contacts" on public.contacts for insert with check (auth.uid() = user_id);
create policy "Users can update own contacts" on public.contacts for update using (auth.uid() = user_id);
create policy "Users can delete own contacts" on public.contacts for delete using (auth.uid() = user_id);

-- Interactions Policies (Inherits access through contacts)
create policy "Users can view own interactions" on public.interactions for select using (
  exists (select 1 from public.contacts where id = contact_id and user_id = auth.uid())
);
create policy "Users can insert own interactions" on public.interactions for insert with check (
  exists (select 1 from public.contacts where id = contact_id and user_id = auth.uid())
);

-- Scans Policies
create policy "Users can view own scans" on public.scans for select using (auth.uid() = user_id);
create policy "Users can insert own scans" on public.scans for insert with check (auth.uid() = user_id);

-- Semantic Search Function
create or replace function match_interactions(query_embedding vector(1536), match_threshold float, match_count int)
returns table (
  id uuid,
  contact_id uuid,
  similarity float
)
language sql stable
as $$
  select
    interactions.id,
    interactions.contact_id,
    1 - (interactions.embedding <=> query_embedding) as similarity
  from interactions
  where 1 - (interactions.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
