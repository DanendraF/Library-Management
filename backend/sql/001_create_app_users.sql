-- ENUM role (compat tanpa IF NOT EXISTS)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'librarian', 'member');
  end if;
end
$$;

-- Tabel profil pengguna (1:1 dengan auth.users)
create table if not exists public.users (
  id uuid primary key
    references auth.users(id) on delete cascade
    default auth.uid(),
  name text not null,
  email text not null unique,
  role user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger untuk updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;

-- Policy: user hanya bisa akses baris miliknya
drop policy if exists "select own profile" on public.users;
create policy "select own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "insert own profile" on public.users;
create policy "insert own profile"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "update own profile" on public.users;
create policy "update own profile"
on public.users
for update
using (auth.uid() = id);

-- Index tambahan (opsional)
create index if not exists idx_users_role on public.users(role);


