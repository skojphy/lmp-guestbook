import { useEffect, useState, type FormEvent } from 'react'
import { addEntry, fetchEntries, usingSupabase, type Entry } from './lib/storage'

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchEntries()
      .then(setEntries)
      .catch(() => setError('방명록을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const entry = await addEntry(name.trim(), message.trim())
      setEntries((prev) => [entry, ...prev])
      setMessage('')
    } catch {
      setError('글을 남기지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <header>
        <h1>방명록</h1>
        <p className="sub">탈출에 성공하셨나요? 한마디 남겨주세요.</p>
        {!usingSupabase && import.meta.env.DEV && (
          <p className="notice">개발 모드: Supabase 키가 없어 이 브라우저에만 저장돼요.</p>
        )}
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <input placeholder="이름 / 팀명" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
        <textarea placeholder="남기고 싶은 말" value={message} maxLength={300} rows={3} onChange={(e) => setMessage(e.target.value)} />
        <button type="submit" disabled={!name.trim() || !message.trim() || submitting}>
          {submitting ? '남기는 중…' : '남기기'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      <ul className="list">
        {loading && <li className="empty">불러오는 중…</li>}
        {!loading && entries.length === 0 && <li className="empty">아직 남겨진 글이 없어요.</li>}
        {entries.map((entry) => (
          <li key={entry.id} className="card">
            <div className="meta">
              <strong>{entry.name}</strong>
              <time>{new Date(entry.createdAt).toLocaleString('ko-KR')}</time>
            </div>
            <p>{entry.message}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
