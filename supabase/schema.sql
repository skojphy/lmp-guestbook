-- 방명록 테이블 + 입장코드. 여러 번 실행해도 안전합니다.
-- 이 SQL은 picture-plane과 함께 쓰는 Supabase 프로젝트에 적용되어 있으므로
-- escape_ 접두사가 붙은 객체만 만듭니다.

-- 1) 방명록 글
create table if not exists public.escape_guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 20),
  message text not null check (char_length(message) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists escape_guestbook_created_at_idx
  on public.escape_guestbook (created_at desc);

-- 브라우저에서 테이블을 직접 읽거나 쓸 수 없게 막고, 아래 함수로만 접근합니다.
alter table public.escape_guestbook enable row level security;
drop policy if exists "guestbook read" on public.escape_guestbook;
drop policy if exists "guestbook insert" on public.escape_guestbook;
revoke all on public.escape_guestbook from anon, authenticated;

-- 2) 입장코드 등 설정값 (브라우저에서 읽을 수 없음)
--    코드 값 자체는 이 파일에 넣지 않습니다. README의 "입장코드 바꾸기" 참고.
create table if not exists public.escape_guestbook_settings (
  key text primary key,
  value text not null
);
alter table public.escape_guestbook_settings enable row level security;
revoke all on public.escape_guestbook_settings from anon, authenticated;

-- 3) 입장코드 확인: 띄어쓰기·공백은 무시합니다.
create or replace function public.escape_guestbook_check_code(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.escape_guestbook_settings s
    where s.key = 'entry_code'
      and regexp_replace(normalize(s.value, NFC), '\s', '', 'g')
        = regexp_replace(normalize(coalesce(p_code, ''), NFC), '\s', '', 'g')
  );
$$;

-- 4) 글 목록 (코드가 틀리면 빈 목록)
create or replace function public.escape_guestbook_list(p_code text)
returns setof public.escape_guestbook
language sql
stable
security definer
set search_path = ''
as $$
  select g.* from public.escape_guestbook g
  where public.escape_guestbook_check_code(p_code)
  order by g.created_at desc
  limit 200;
$$;

-- 5) 글 남기기 (코드가 틀리면 아무것도 저장하지 않고 빈 결과)
create or replace function public.escape_guestbook_add(p_code text, p_name text, p_message text)
returns setof public.escape_guestbook
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.escape_guestbook (name, message)
  select btrim(p_name), btrim(p_message)
  where public.escape_guestbook_check_code(p_code)
  returning *;
$$;

revoke all on function public.escape_guestbook_check_code(text) from public;
revoke all on function public.escape_guestbook_list(text) from public;
revoke all on function public.escape_guestbook_add(text, text, text) from public;
grant execute on function public.escape_guestbook_check_code(text) to anon, authenticated;
grant execute on function public.escape_guestbook_list(text) to anon, authenticated;
grant execute on function public.escape_guestbook_add(text, text, text) to anon, authenticated;
