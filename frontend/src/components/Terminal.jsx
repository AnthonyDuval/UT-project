import { useEffect, useRef, useState } from 'react'
import { getLineClass } from '../utils/lineStyle'
import './Terminal.css'

/**
 * Terminal immersif — caret natif, effets horreur (ghost typing, possession).
 */
export default function Terminal({
  lines,
  onCommand,
  disabled,
  horrorEffect,
  onHorrorEffectDone,
}) {
  const [input, setInput] = useState('')
  const [possessed, setPossessed] = useState(false)
  const outputRef = useRef(null)
  const inputRef = useRef(null)
  const horrorRunRef = useRef(0)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    if (!disabled && inputRef.current && !possessed) {
      inputRef.current.focus()
    }
  }, [disabled, lines, possessed])

  useEffect(() => {
    if (!horrorEffect?.text || disabled) return undefined

    const runId = horrorRunRef.current + 1
    horrorRunRef.current = runId
    const isPossession = horrorEffect.type === 'cursor_possession'
    const charDelay = isPossession ? 90 : 130
    const text = horrorEffect.text

    setPossessed(true)
    setInput('')

    let index = 0
    const typeInterval = setInterval(() => {
      if (horrorRunRef.current !== runId) return
      index += 1
      setInput(text.slice(0, index))

      if (index >= text.length) {
        clearInterval(typeInterval)
        const holdMs = horrorEffect.holdMs ?? 800

        setTimeout(() => {
          if (horrorRunRef.current !== runId) return

          if (horrorEffect.submit) {
            onCommand?.(text)
            setInput('')
          }

          setTimeout(() => {
            if (horrorRunRef.current !== runId) return
            setInput('')
            setPossessed(false)
            onHorrorEffectDone?.()
          }, horrorEffect.submit ? 300 : holdMs)
        }, holdMs)
      }
    }, charDelay)

    return () => {
      horrorRunRef.current += 1
      clearInterval(typeInterval)
      setPossessed(false)
    }
  }, [horrorEffect, disabled, onCommand, onHorrorEffectDone])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || disabled || possessed) return
    onCommand(input)
    setInput('')
  }

  const handlePanelClick = () => {
    if (!disabled && !possessed && inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div
      className={`terminal terminal--immersive ${possessed ? 'terminal--possessed' : ''}`}
      onClick={handlePanelClick}
    >
      <div className="terminal__crt" aria-hidden="true" />
      {possessed && <div className="terminal__possession-glow" aria-hidden="true" />}
      <div className="terminal__output" ref={outputRef}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={`terminal__line ${getLineClass(line)}`}
            style={{ animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}
          >
            {line}
          </div>
        ))}
      </div>

      <form className="terminal__input-row" onSubmit={handleSubmit}>
        <span className="terminal__prompt">ghost@ultratech:~$</span>
        {disabled ? (
          <span className="terminal__locked">▌ SESSION VERROUILLÉE</span>
        ) : (
          <input
            ref={inputRef}
            className={`terminal__input ${possessed ? 'terminal__input--possessed' : ''}`}
            type="text"
            value={input}
            onChange={(e) => {
              if (!possessed) setInput(e.target.value)
            }}
            readOnly={possessed}
            autoComplete="off"
            spellCheck="false"
            aria-label="Commande terminal"
          />
        )}
      </form>
    </div>
  )
}
