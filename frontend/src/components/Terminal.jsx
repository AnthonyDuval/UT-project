import { useEffect, useRef, useState } from 'react'
import { getLineClass } from '../utils/lineStyle'
import './Terminal.css'

/**
 * Terminal immersif — coeur du jeu, coloration intelligente, CRT discret.
 */
export default function Terminal({ lines, onCommand, disabled }) {
  const [input, setInput] = useState('')
  const outputRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled, lines])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onCommand(input)
    setInput('')
  }

  const handlePanelClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="terminal terminal--immersive" onClick={handlePanelClick}>
      <div className="terminal__crt" aria-hidden="true" />
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
        <input
          ref={inputRef}
          className="terminal__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? '▌ SESSION VERROUILLÉE' : 'Entrez une commande…'}
          autoComplete="off"
          spellCheck="false"
        />
        {!disabled && <span className="terminal__cursor">▌</span>}
        {disabled && <span className="terminal__cursor terminal__cursor--wait">▌</span>}
      </form>
    </div>
  )
}
