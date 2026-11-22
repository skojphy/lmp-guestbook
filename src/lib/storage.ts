import { createClient } from '@supabase/supabase-js'

export type Entry = {
  id: string
  name: string
  message: string
  createdAt: number
}

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 입장코드 정답은 Supabase 안에만 있고, 이 코드(브라우저)에는 들어가지 않습니다.
// 설정이 빠져 있으면 아무것도 통과시키지 않습니다.
const supabase = url && anonKey ? createClient(url, anonKey) : null
if (!supabase) console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 환경변수가 없습니다.')

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export class WrongCodeError extends Error {}

type Row = { id: string; name: string; message: string; created_at: string }
const fromRow = (r: Row): Entry => ({
  id: r.id,
  name: r.name,
  message: r.message,
  createdAt: new Date(r.created_at).getTime(),
})

// 입장코드 기억 (새로고침해도 다시 묻지 않게)
const CODE_KEY = 'guestbook.code'
export function rememberedCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY)
  } catch {
    return null
  }
}
export function rememberCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code)
    else localStorage.removeItem(CODE_KEY)
  } catch {
    // 저장 불가 환경(시크릿 모드 등)은 무시
  }
}

export async function checkCode(code: string): Promise<boolean> {
  const { data, error } = await client().rpc('escape_guestbook_check_code', { p_code: code })
  if (error) throw error
  return data === true
}

export async function fetchEntries(code: string): Promise<Entry[]> {
  const { data, error } = await client().rpc('escape_guestbook_list', { p_code: code })
  if (error) throw error
  return (data as Row[]).map(fromRow)
}

export async function addEntry(code: string, name: string, message: string): Promise<Entry> {
  const { data, error } = await client().rpc('escape_guestbook_add', {
    p_code: code,
    p_name: name,
    p_message: message,
  })
  if (error) throw error
  const rows = data as Row[]
  if (rows.length === 0) throw new WrongCodeError() // 코드가 바뀌었거나 틀림
  return fromRow(rows[0])
}
