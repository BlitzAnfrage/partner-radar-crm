create extension if not exists "pgcrypto";

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'n8n',
  status text not null default 'PENDING' check (status in ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED')),
  requested_by text,
  started_at timestamptz,
  finished_at timestamptz,
  leads_found integer not null default 0,
  leads_inserted integer not null default 0,
  leads_updated integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid references public.import_runs(id) on delete set null,
  source_id text unique,
  data_source text not null default 'OpenStreetMap / Overpass',
  company_name text not null,
  region_name text,
  category_group text,
  category text,
  address text,
  phone text,
  emails text[] not null default '{}',
  website text,
  maps_url text,
  google_search_url text,
  phone_search_url text,
  contact_person text,
  decision_maker_phone text,
  decision_maker_email text,
  opening_hours text,
  lat double precision,
  lon double precision,
  score integer not null default 0 check (score >= 0 and score <= 100),
  lead_quality_code text check (lead_quality_code in ('A', 'B', 'C', 'D')),
  lead_quality_label text,
  chain_hint text not null default 'LOCAL' check (chain_hint in ('LOCAL', 'CHAIN', 'BRANCH')),
  status text not null default 'NEW' check (
    status in ('NEW', 'CALLED', 'NOT_REACHED', 'INTERESTED', 'APPOINTMENT', 'PARTNER', 'REJECTED', 'NOT_FIT', 'BLACKLIST')
  ),
  last_contacted_at timestamptz,
  last_contact_result text,
  contact_count integer not null default 0,
  call_note text,
  appointment_at timestamptz,
  appointment_note text,
  internal_notes text,
  last_email_subject text,
  last_email_body text,
  last_email_sent_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  contact_type text not null check (contact_type in ('CALL', 'EMAIL', 'APPOINTMENT', 'NOTE')),
  result text,
  note text,
  email_subject text,
  email_body text,
  contacted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_import_runs_updated_at on public.import_runs;
create trigger set_import_runs_updated_at
before update on public.import_runs
for each row
execute function public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

drop trigger if exists set_contact_logs_updated_at on public.contact_logs;
create trigger set_contact_logs_updated_at
before update on public.contact_logs
for each row
execute function public.set_updated_at();

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

create index if not exists leads_source_id_idx on public.leads(source_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_region_name_idx on public.leads(region_name);
create index if not exists leads_category_idx on public.leads(category);
create index if not exists leads_lead_quality_code_idx on public.leads(lead_quality_code);
create index if not exists leads_score_idx on public.leads(score desc);
create index if not exists leads_chain_hint_idx on public.leads(chain_hint);
create index if not exists leads_lat_lon_idx on public.leads(lat, lon);
create index if not exists leads_updated_at_idx on public.leads(updated_at desc);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_import_run_id_idx on public.leads(import_run_id);
create index if not exists contact_logs_lead_id_idx on public.contact_logs(lead_id);
create index if not exists import_runs_status_idx on public.import_runs(status);

alter table public.leads enable row level security;
alter table public.contact_logs enable row level security;
alter table public.import_runs enable row level security;
alter table public.app_settings enable row level security;
