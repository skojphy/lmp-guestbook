import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
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

const COLORS = ['yellow', 'pink', 'mint', 'blue', 'orange'] as const

// 글 id로 색과 기울기를 정해서 새로고침해도 같은 모양으로 보이게
function noteLook(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const n = Math.abs(h)
  return {
    color: COLORS[n % COLORS.length],
    tilt: ((n >> 3) % 9) - 4, // -4° ~ 4°
  }
}

const tiltStyle = (deg: number) => ({ '--tilt': `${deg}deg` }) as CSSProperties

export default function App() {
  const [code, setCode] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // 예전에 맞힌 코드가 아직 유효하면 바로 입장
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
      <header className="title-strip">
        <h1>방명록</h1>
        <p>탈출에 성공하셨나요? 한마디 남겨주세요.</p>
      </header>
      {!usingSupabase && import.meta.env.DEV && (
        <p className="notice">개발 모드: Supabase 키가 없어 이 브라우저에만 저장되고, 아무 코드나 통과돼요.</p>
      )}

      {checking ? (
        <p className="board-msg">확인하는 중…</p>
      ) : code ? (
        <Wall code={code} onCodeInvalid={leave} />
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
  const [shakeKey, setShakeKey] = useState(0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      if (await checkCode(input)) {
        onEnter(input)
      } else {
        setError('입장코드가 맞지 않아요.')
        setShakeKey((k) => k + 1)
      }
    } catch {
      setError('확인하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      key={shakeKey}
      className={`note yellow compose gate${shakeKey ? ' shake' : ''}`}
      style={tiltStyle(-2)}
      onSubmit={handleSubmit}
    >
      <label htmlFor="entry-code">입장코드</label>
      <p className="hint">문제를 풀고 얻은 정답을 적어주세요.</p>
      <input
        id="entry-code"
        placeholder="정답"
        value={input}
        maxLength={30}
        autoComplete="off"
        autoFocus
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit" disabled={!input.trim() || submitting}>
        {submitting ? '확인 중…' : '입장하기'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}

function Wall({ code, onCodeInvalid }: { code: string; onCodeInvalid: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  useEffect(() => {
    fetchEntries(code)
      .then(setEntries)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [code])

  return (
    <ul className="wall">
      <li>
        <Compose
          code={code}
          onCodeInvalid={onCodeInvalid}
          onAdded={(entry) => {
            setEntries((prev) => [entry, ...prev])
            setJustAdded(entry.id)
          }}
        />
      </li>
      {loading && <li className="board-msg">쪽지를 불러오는 중…</li>}
      {loadError && <li className="board-msg">방명록을 불러오지 못했어요.</li>}
      {!loading && !loadError && entries.length === 0 && (
        <li className="board-msg">아직 붙은 쪽지가 없어요. 첫 쪽지를 남겨주세요!</li>
      )}
      {entries.map((entry) => {
        const look = noteLook(entry.id)
        return (
          <li key={entry.id}>
            <article
              className={`note ${look.color}${entry.id === justAdded ? ' just-added' : ''}`}
              style={tiltStyle(look.tilt)}
            >
              <p>{entry.message}</p>
              <div className="from">— {entry.name}</div>
              <time dateTime={new Date(entry.createdAt).toISOString()}>
                {new Date(entry.createdAt).toLocaleDateString('ko-KR')}
              </time>
            </article>
          </li>
        )
      })}
    </ul>
  )
}

function Compose({
  code,
  onAdded,
  onCodeInvalid,
}: {
  code: string
  onAdded: (entry: Entry) => void
  onCodeInvalid: () => void
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      onAdded(await addEntry(code, name.trim(), message.trim()))
      setMessage('')
    } catch (err) {
      if (err instanceof WrongCodeError) onCodeInvalid()
      else setError('붙이지 못했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="note yellow compose" style={tiltStyle(-1)} onSubmit={handleSubmit}>
      <span className="label">새 쪽지</span>
      <textarea
        aria-label="남기고 싶은 말"
        placeholder="남기고 싶은 말"
        value={message}
        maxLength={300}
        rows={4}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        aria-label="이름 / 팀명"
        placeholder="— 이름 / 팀명"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" disabled={!name.trim() || !message.trim() || submitting}>
        {submitting ? '붙이는 중…' : '붙이기'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}
