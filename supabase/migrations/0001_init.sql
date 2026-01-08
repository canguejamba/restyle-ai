-- Enable UUID generation
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key, -- Clerk userId
  credits int not null default 0,
  free_used int not null default 0,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('queued','running','succeeded','failed');
  end if;
end $$;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  status public.job_status not null default 'queued',

  room_type text not null,
  style text not null,
  intensity text not null check (intensity in ('low','medium','high')),

  model text not null,
  params jsonb not null default '{}'::jsonb,

  input_image_url text not null,
  error text null,

  created_at timestamptz not null default now(),
  started_at timestamptz null,
  finished_at timestamptz null
);

create table if not exists public.job_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  image_url text not null,
  index int not null check (index >= 0 and index <= 3),
  created_at timestamptz not null default now(),
  unique(job_id, index)
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  job_id uuid null references public.jobs(id) on delete set null,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_user_created on public.jobs(user_id, created_at desc);
create index if not exists idx_jobs_status on public.jobs(status);
