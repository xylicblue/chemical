create table public.cms_live (
  id boolean primary key default true check (id),
  content jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
create table public.cms_draft (
  id boolean primary key default true check (id),
  content jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
create table public.cms_history (
  id uuid primary key default gen_random_uuid(),
  content jsonb not null,
  revision integer unique not null,
  created_at timestamptz not null default now()
);
create table public.cms_settings (
  id boolean primary key default true check (id),
  generation integer not null default 1,
  password_hash text,
  password_salt text,
  bootstrap_hash text,
  bootstrap_expires timestamptz,
  updated_at timestamptz not null default now()
);
create table public.cms_sessions (
  token_hash text primary key,
  generation integer not null default 1,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table public.cms_rate_limits (
  key text primary key,
  count integer not null default 1,
  expires_at timestamptz not null
);
create table public.cms_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  company text not null default '' check (length(company) <= 180),
  product text not null default '' check (length(product) <= 180),
  quantity text not null default '' check (length(quantity) <= 180),
  message text not null check (length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new','reviewed')),
  created_at timestamptz not null default now()
);
create index cms_inquiries_created_at_idx on public.cms_inquiries(created_at desc);
create index cms_sessions_expires_at_idx on public.cms_sessions(expires_at);
create index cms_rate_limits_expires_at_idx on public.cms_rate_limits(expires_at);

alter table public.cms_live enable row level security;
alter table public.cms_draft enable row level security;
alter table public.cms_history enable row level security;
alter table public.cms_settings enable row level security;
alter table public.cms_sessions enable row level security;
alter table public.cms_rate_limits enable row level security;
alter table public.cms_inquiries enable row level security;

revoke all on public.cms_live, public.cms_draft, public.cms_history, public.cms_settings, public.cms_sessions, public.cms_rate_limits, public.cms_inquiries from anon, authenticated;
grant all on public.cms_live, public.cms_draft, public.cms_history, public.cms_settings, public.cms_sessions, public.cms_rate_limits, public.cms_inquiries to service_role;

create function public.cms_take_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare current_count integer;
begin
  if p_limit < 1 or p_seconds < 1 then return false; end if;
  insert into public.cms_rate_limits as limits(key, count, expires_at)
  values (p_key, 1, now() + make_interval(secs => p_seconds))
  on conflict (key) do update set
    count = case when limits.expires_at <= now() then 1 else limits.count + 1 end,
    expires_at = case when limits.expires_at <= now() then now() + make_interval(secs => p_seconds) else limits.expires_at end
  returning count into current_count;
  return current_count <= p_limit;
end; $$;

create function public.cms_save_draft(p_content jsonb, p_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare new_revision integer;
begin
  update public.cms_draft set content=p_content, revision=revision+1, updated_at=now()
  where id=true and revision=p_revision returning revision into new_revision;
  if new_revision is null then raise exception 'DRAFT_CONFLICT'; end if;
  return new_revision;
end; $$;

create function public.cms_publish_draft(p_revision integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare draft public.cms_draft; live_version integer;
begin
  select * into draft from public.cms_draft where id=true for update;
  if draft.revision is distinct from p_revision then raise exception 'DRAFT_CONFLICT'; end if;
  update public.cms_live set content=draft.content, revision=revision+1, updated_at=now()
  where id=true returning revision into live_version;
  insert into public.cms_history(content, revision) values(draft.content, live_version);
  delete from public.cms_history where revision < live_version - 29;
  return jsonb_build_object('revision', draft.revision, 'liveRevision', live_version);
end; $$;

revoke all on function public.cms_take_rate_limit(text,integer,integer), public.cms_save_draft(jsonb,integer), public.cms_publish_draft(integer) from public, anon, authenticated;
grant execute on function public.cms_take_rate_limit(text,integer,integer), public.cms_save_draft(jsonb,integer), public.cms_publish_draft(integer) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('website-images','website-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
