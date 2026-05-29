import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchChat, sendChatMessage } from '../api/client'
import './GlobalChat.css'

const POLL_INTERVAL_MS = 3000

/**
 * Canal clandestin global — polling toutes les 3 secondes.
 */
export default function GlobalChat({ username, disabled }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const listRef = useRef(null)

  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchChat()
      setMessages(data.messages || [])
      setError(null)
    } catch (err) {
      if (err.code !== 'UNAUTHORIZED') {
        setError(err.message)
      }
    }
  }, [])

  useEffect(() => {
    loadMessages()
    const id = setInterval(loadMessages, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [loadMessages])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || disabled) return

    setSending(true)
    setError(null)
    try {
      await sendChatMessage(text)
      setInput('')
      await loadMessages()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '--:--'
    }
  }

  return (
    <div className="gchat">
      <header className="gchat__header">
        <h2 className="gchat__title">CANAL CLANDESTIN GLOBAL</h2>
        <span className="gchat__status">● LIVE — polling 3s</span>
      </header>

      {error && <div className="gchat__error">{error}</div>}

      <div className="gchat__messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="gchat__empty">Aucun message. Soyez le premier opérateur sur le canal.</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={`${msg.timestamp}-${i}`}
              className={`gchat__msg ${msg.username === username ? 'gchat__msg--self' : ''}`}
            >
              <span className="gchat__time">{formatTime(msg.timestamp)}</span>
              <span className="gchat__user">{msg.username}</span>
              <span className="gchat__text">{msg.message}</span>
            </div>
          ))
        )}
      </div>

      <form className="gchat__form" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message chiffré..."
          maxLength={500}
          disabled={disabled || sending}
        />
        <button type="submit" disabled={disabled || sending || !input.trim()}>
          ENVOYER
        </button>
      </form>
    </div>
  )
}
