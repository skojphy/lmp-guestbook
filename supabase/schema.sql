-- 방명록 테이블. Supabase 대시보드 → SQL Editor에 붙여넣고 Run.
-- 기존 프로젝트와 겹치지 않도록 escape_ 접두사를 붙였습니다.

create table if not exists public.escape_guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 20),
  message text not null check (char_length(message) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists escape_guestbook_created_at_idx
  on public.escape_guestbook (created_at desc);

-- 누구나 읽고 쓸 수 있지만, 수정·삭제는 불가(대시보드에서만 관리).
alter table public.escape_guestbook enable row level security;

drop policy if exists "guestbook read" on public.escape_guestbook;
create policy "guestbook read" on public.escape_guestbook
  for select to anon, authenticated using (true);

drop policy if exists "guestbook insert" on public.escape_guestbook;
create policy "guestbook insert" on public.escape_guestbook
  for insert to anon, authenticated with check (true);
