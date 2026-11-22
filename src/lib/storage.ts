import { createClient } from '@supabase/supabase-js'

export type Entry = {
  id: string
  name: string
  message: string
  createdAt: number
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// .env.local에 키가 있으면 Supabase, 없으면 브라우저(localStorage)에 저장합니다.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const usingSupabase = supabase !== null

const TABLE = 'escape_guestbook'
const LOCAL_KEY = 'guestbook.entries'

type Row = { id: string; name: string; message: string; created_at: string }
const fromRow = (r: Row): Entry => ({
  id: r.id,
  name: r.name,
  message: r.message,
  createdAt: new Date(r.created_at).getTime(),
})

function readLocal(): Entry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as Entry[]) : []
  } catch {
    return []
  }
}

export async function fetchEntries(): Promise<Entry[]> {
  if (!supabase) return readLocal()
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data as Row[]).map(fromRow)
}

export async function addEntry(name: string, message: string): Promise<Entry> {
  if (!supabase) {
    const entry: Entry = { id: crypto.randomUUID(), name, message, createdAt: Date.now() }
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify([entry, ...readLocal()]))
    } catch {
      // 저장 불가 환경(시크릿 모드 등)은 무시
    }
    return entry
  }
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, message })
    .select('id, name, message, created_at')
    .single()
  if (error) throw error
  return fromRow(data as Row)
}
