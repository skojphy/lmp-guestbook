# 방명록 (guestbook)

방탈출 손님용 방명록 페이지. Vite + React + TypeScript, 저장소는 Supabase.

## 처음 세팅

1. Supabase 대시보드 → **SQL Editor**에서 `supabase/schema.sql` 내용을 붙여넣고 Run
   → `escape_guestbook` 테이블과 접근 규칙(누구나 읽기·쓰기, 수정·삭제 불가)이 생깁니다.
2. `.env.example`을 `.env.local`로 복사하고 값을 채웁니다.
   (Project Settings → API의 **Project URL**과 **anon public** 키. `service_role` 키는 넣지 마세요.)
3. 실행

```bash
npm install
npm run dev
```

키가 없으면 개발 중에는 브라우저(localStorage)에만 저장됩니다.

## 글 관리

수정·삭제는 페이지에서 막혀 있습니다. Supabase 대시보드 → Table Editor → `escape_guestbook`에서 직접 지우면 됩니다.
