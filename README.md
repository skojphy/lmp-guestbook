# 방명록 (guestbook)

방탈출 손님용 방명록 페이지. Vite + React + TypeScript, 저장소는 Supabase.
손님은 문제를 풀어 얻은 **입장코드**를 맞혀야 방명록을 보고 글을 남길 수 있습니다.

## 실행

```bash
npm install
npm run dev
```

`.env.local`에 Supabase 주소와 공개용(publishable/anon) 키가 필요합니다. 형식은 `.env.example` 참고.
키가 없으면 개발용으로 브라우저에만 저장되고 아무 코드나 통과됩니다.

## 입장코드 동작

- 정답은 **Supabase의 `escape_guestbook_settings` 테이블에만** 있습니다. 브라우저 코드·환경변수·이 저장소에는 없습니다.
- 띄어쓰기와 공백은 무시하고 비교합니다. (예: `정답 코드` = `정답코드`)
- 한 번 맞히면 그 브라우저에서는 다시 묻지 않습니다. 정답을 바꾸면 다음 접속 때 다시 묻습니다.
- 브라우저에서 방명록 테이블을 직접 읽거나 쓸 수 없고, 코드를 확인하는 Supabase 함수로만 접근합니다.

## 입장코드 바꾸기

Supabase SQL Editor(또는 `npx supabase db query --remote`)에서:

```sql
update public.escape_guestbook_settings set value = '새정답' where key = 'entry_code';
```

## DB 구조 바꾸기

`supabase/schema.sql`을 고친 뒤 같은 프로젝트에 다시 실행합니다. 여러 번 실행해도 안전합니다.
이 Supabase 프로젝트는 picture-plane·duck-gil과 함께 쓰므로 `escape_` 접두사 객체만 만듭니다.
**picture-plane 폴더에서 `supabase db push`는 하지 마세요.** 다른 앱의 미적용 마이그레이션까지 함께 적용됩니다.

## 글 관리

수정·삭제는 페이지에서 막혀 있습니다. Supabase 대시보드 → Table Editor → `escape_guestbook`에서 직접 지웁니다.
