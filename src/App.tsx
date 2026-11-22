import { useEffect, useState, type FormEvent } from 'react'
import {
  addEntry,
  checkCode,
  fetchEntries,
  rememberCode,
  rememberedCode,
  usingSupabase,
  WrongCodeError,
  type Entry,
} from './lib/storage'

export default function App() {
  const [code, setCode] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // 예전에 맞힌 코드가 있으면 아직 유효한지 확인하고 바로 입장
  useEffect(() => {
    const saved = rememberedCode()
    if (!saved) {
      setChecking(false)
      return
    }
    checkCode(saved)
      .then((ok) => {
        if (ok) setCode(saved)
        else rememberCode(null)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  function leave() {
    rememberCode(null)
    setCode(null)
  }

  return (
    <main className="page">
      <header>
        <h1>방명록</h1>
        <p className="sub">탈출에 성공하셨나요? 한마디 남겨주세요.</p>
        {!usingSupabase && import.meta.env.DEV && (
          <p className="notice">개발 모드: Supabase 키가 없어 이 브라우저에만 저장되고, 아무 코드나 통과돼요.</p>
        )}
      </header>

      {checking ? (
        <p className="empty">확인하는 중…</p>
      ) : code ? (
        <Guestbook code={code} onCodeInvalid={leave} />
      ) : (
        <Gate
          onEnter={(c) => {
            rememberCode(c)
            setCode(c)
          }}
        />
      )}
    </main>
  )
}

function Gate({ onEnter }: { onEnter: (code: string) => void }) {
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      if (await checkCode(input)) onEnter(input)
      else setError('입장코드가 맞지 않아요.')
    } catch {
      setError('확인하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="card form gate" onSubmit={handleSubmit}>
      <label htmlFor="entry-code">입장코드</label>
      <p className="hint">문제를 풀고 얻은 정답을 입력하세요.</p>
      <input
        id="entry-code"
        placeholder="정답 입력"
        value={input}
        maxLength={30}
        autoComplete="off"
        autoFocus
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit" disabled={!input.trim() || submitting}>
        {submitting ? '확인 중…' : '입장하기'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

function Guestbook({ code, onCodeInvalid }: { code: string; onCodeInvalid: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchEntries(code)
      .then(setEntries)
      .catch(() => setError('방명록을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [code])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const entry = await addEntry(code, name.trim(), message.trim())
      setEntries((prev) => [entry, ...prev])
      setMessage('')
    } catch (err) {
      if (err instanceof WrongCodeError) onCodeInvalid()
      else setError('글을 남기지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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
    </>
  )
}
