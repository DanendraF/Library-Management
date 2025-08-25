-- Books table
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  category_id uuid references public.categories(id) on delete set null,
  isbn text,
  published_year int,
  cover_url text,
  description text,
  total_copies int not null default 1,
  available_copies int not null default 1,
  rating numeric(3,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_books_updated_at on public.books;
create trigger set_books_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

-- RLS: public read, write restricted (for now allow via service role/backend only)
alter table public.books enable row level security;

drop policy if exists "books_select_all" on public.books;
create policy "books_select_all"
on public.books for select using (true);

-- Useful indexes
create index if not exists idx_books_category on public.books(category_id);
create index if not exists idx_books_title on public.books using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(author,'')));


