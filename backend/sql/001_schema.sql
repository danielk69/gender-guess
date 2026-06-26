-- Gender Guesser — database schema
-- Run this in the Supabase SQL editor

-- ─────────────────────────────────────────────
-- images: portrait pool for the game
-- ─────────────────────────────────────────────
create table if not exists public.images (
  id              text primary key,
  storage_path    text not null unique,
  public_url      text not null,
  is_transgender  boolean not null,
  source          text not null default 'seed'
    check (source in ('seed', 'llm', 'manual')),
  created_at      timestamptz not null default now()
);

create index if not exists images_is_transgender_idx
  on public.images (is_transgender);

-- ─────────────────────────────────────────────
-- leaderboard_entries: global high scores
-- ─────────────────────────────────────────────
create table if not exists public.leaderboard_entries (
  id              uuid primary key default gen_random_uuid(),
  player_name     text not null
    check (char_length(player_name) between 2 and 24),
  score           integer not null default 0 check (score >= 0),
  correct_count   integer not null default 0 check (correct_count >= 0),
  wrong_count     integer not null default 0 check (wrong_count >= 0),
  max_streak      integer not null default 0 check (max_streak >= 0),
  rounds_played   integer not null default 0 check (rounds_played > 0),
  created_at      timestamptz not null default now(),
  constraint score_bounds check (
    score <= rounds_played * 100 + max_streak * 25
  )
);

create index if not exists leaderboard_score_idx
  on public.leaderboard_entries (score desc);

-- ─────────────────────────────────────────────
-- get_random_image: pick one image, optionally
-- excluding IDs already shown this session
-- ─────────────────────────────────────────────
create or replace function public.get_random_image(exclude_ids text[] default '{}')
returns table (
  id text,
  storage_path text,
  public_url text,
  is_transgender boolean
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.storage_path, i.public_url, i.is_transgender
  from public.images i
  where not (i.id = any(exclude_ids))
  order by random()
  limit 1;
$$;

-- ─────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────
alter table public.images enable row level security;
alter table public.leaderboard_entries enable row level security;

drop policy if exists "images_select_public" on public.images;
create policy "images_select_public"
  on public.images for select to anon, authenticated using (true);

drop policy if exists "leaderboard_select_public" on public.leaderboard_entries;
create policy "leaderboard_select_public"
  on public.leaderboard_entries for select to anon, authenticated using (true);

drop policy if exists "leaderboard_insert_public" on public.leaderboard_entries;
create policy "leaderboard_insert_public"
  on public.leaderboard_entries for insert to anon, authenticated
  with check (
    char_length(player_name) between 2 and 24
    and rounds_played > 0
    and score <= rounds_played * 100 + max_streak * 25
  );

grant execute on function public.get_random_image(text[]) to anon, authenticated;
