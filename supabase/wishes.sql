-- Run in Supabase SQL editor if the table is missing or needs the thumbnail column.
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  star_x double precision not null,
  star_y double precision not null,
  is_public boolean default true,
  drawing_data text,
  created_at timestamptz default now()
);

alter table public.wishes add column if not exists drawing_data text;

-- Example policy (adjust for your security model):
-- alter table public.wishes enable row level security;
-- create policy "read public wishes" on public.wishes for select using (is_public = true);
-- create policy "insert wishes" on public.wishes for insert with check (true);
-- create policy "delete wishes" on public.wishes for delete using (true);
