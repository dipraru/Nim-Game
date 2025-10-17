import React, { useState, useEffect, useRef } from 'react'

// generate `count` unique random integers in [min..max]
function generateUniquePiles(count, min = 4, max = 18) {
  const range = max - min + 1
  if (count <= 0) return []
  if (count > range) {
    // fallback: fill with sequential values if count exceeds unique range
    return Array.from({ length: count }).map((_, i) => min + (i % range))
  }
  const set = new Set()
  while (set.size < count) {
    const v = Math.floor(Math.random() * range) + min
    set.add(v)
  }
  return Array.from(set)
}

export default function Game({ mode = 'local', socket = null, roomId = null, players = [], pilesCount = 3, matchMinutes = 6, onReset }) {
  const [piles, setPiles] = useState(() => generateUniquePiles(pilesCount, 4, 18))
  const [turn, setTurn] = useState(0) // 0 = players[0], 1 = players[1]
  const [status, setStatus] = useState('playing')
  const [winner, setWinner] = useState(null)
  const [blasts, setBlasts] = useState({}) // { pileIndex: clickedTopIndex }
  // clocks in milliseconds per player
  const perPlayerMs = Math.max(1, (Number(matchMinutes) || 6) * 60 * 1000 / 2)
  const [clocks, setClocks] = useState(() => [perPlayerMs, perPlayerMs])
  // refs for stable timer handling
  const lastRef = useRef(null)
  const turnRef = useRef(turn)
  const intervalRef = useRef(null)

  // clickedTopIndex: index from top (0 = topmost). Clicking a bomb blasts that bomb and all bombs above it (i.e. the top part).
  const clickBomb = (pileIndex, topIndex) => {
    if (status !== 'playing') return
    if (pileIndex < 0 || pileIndex >= piles.length) return
    const count = piles[pileIndex]
    if (topIndex < 0 || topIndex >= count) return

    // Register blast for animation. topIndex 0 = topmost bomb, so removed bombs = count - topIndex
    setBlasts((b) => ({ ...b, [pileIndex]: topIndex }))

    // In online mode, send move to server (server will broadcast room_update)
    const removed = topIndex + 1 // remove clicked bomb and all bombs above it
    if (mode === 'online' && socket && roomId) {
      socket.emit('make_move', { roomId, pileIndex, take: removed })
      // locally mark blast for UX while server confirms
      setBlasts((b) => ({ ...b, [pileIndex]: topIndex }))
      setTimeout(() => {
        setBlasts((b) => { const nb = { ...b }; delete nb[pileIndex]; return nb })
      }, 520)
      return
    }

    // Local mode: update locally
    setTimeout(() => {
      setPiles((prev) => {
        const next = [...prev]
        next[pileIndex] = Math.max(0, prev[pileIndex] - removed)
        return next
      })

      setBlasts((b) => {
        const nb = { ...b }
        delete nb[pileIndex]
        return nb
      })

      // Check win
      setTimeout(() => {
        setPiles((curr) => {
          const allZero = curr.every((p) => p === 0)
          if (allZero) {
            setStatus('finished')
            setWinner(turn)
          } else {
            setTurn((t) => (t + 1) % 2)
          }
          return curr
        })
      }, 50)
    }, 520) // match animation duration in CSS for particles
  }


  const restart = () => {
    if (mode === 'online' && socket && roomId) {
      socket.emit('restart', { roomId })
      return
    }

    setPiles(() => generateUniquePiles(pilesCount, 4, 18))
    setTurn(0)
    setStatus('playing')
    setWinner(null)
    setBlasts({})
    setClocks([perPlayerMs, perPlayerMs])
    // reset refs so interval effect restarts immediately
    lastRef.current = Date.now()
  }

  const terminate = () => {
    // go back to main menu
    onReset()
  }

  // No AI in two-player local mode; turns alternate between players on each valid move

  // keep turnRef in sync with turn state
  useEffect(() => {
    turnRef.current = turn
  }, [turn])

  // socket listeners for online play
  useEffect(() => {
    if (mode !== 'online' || !socket) return
    const onRoom = ({ roomId, room }) => {
      if (!room) return
      // sync local state with server room
      if (room.piles) setPiles(room.piles)
      if (typeof room.currentTurn === 'number') setTurn(room.currentTurn % (room.turnOrder?.length || 2))
      if (room.status) setStatus(room.status)
      // map winner socket id to player index based on turnOrder
      if (room.winner) {
        const idx = room.turnOrder?.indexOf(room.winner)
        setWinner(typeof idx === 'number' && idx >= 0 ? idx : null)
      }
      // update players list based on turnOrder
      const playerNames = (room.turnOrder || []).map(id => (room.players && room.players[id] && room.players[id].name) || 'Player')
      if (playerNames.length === 1) playerNames.push('Waiting...')
      // update displayed player names by mutating DOM via state where appropriate
      // (we'll rely on props.players passed from App, but if not present, set local fallback)
      // no direct state for players here; parent `App` maintains player list
    }
    const onError = (msg) => {
      console.warn('server error:', msg)
      alert(msg)
    }
    socket.on('room_update', onRoom)
    socket.on('error_msg', onError)
    return () => {
      socket.off('room_update', onRoom)
      socket.off('error_msg', onError)
    }
  }, [mode, socket])

  // Tick timer while playing. Use refs to avoid stale closures and ensure interval
  // starts immediately on status change or restart.
  useEffect(() => {
    // clear any previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (status !== 'playing') return

    lastRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const dt = now - (lastRef.current || now)
      lastRef.current = now

      setClocks((prev) => {
        const next = [...prev]
        const idx = turnRef.current
        next[idx] = Math.max(0, next[idx] - dt)
        // if time ran out for current player, finish
        if (next[idx] <= 0) {
          // stop interval before updating status to avoid race
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setStatus('finished')
          setWinner((idx + 1) % 2)
        }
        return next
      })
    }, 200)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  // only restart this effect when status changes
  }, [status])

  // helper: format ms to mm:ss
  const fmt = (ms) => {
    const s = Math.ceil(ms / 1000)
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  return (
    <div className="card game">
      <div className="header">
        <div>
          <h2>NIM — Local Play</h2>
          <div className="subtitle">Click a bomb to blast it and all bombs above it</div>
        </div>
        <div className="controls-top">
          <button onClick={terminate} className="danger">Terminate</button>
          <button onClick={restart} className="secondary">Restart</button>
        </div>
      </div>

      <div className="players">
        <div className={turn === 0 ? 'player current' : 'player'}>
          <div className="player-name">{players[0]}{winner === 0 ? ' (winner)' : ''}</div>
          <div className={`clock ${clocks[0] <= 10000 ? 'low' : ''}`}>{fmt(clocks[0])}</div>
        </div>
        <div className={turn === 1 ? 'player current' : 'player'}>
          <div className="player-name">{players[1]}{winner === 1 ? ' (winner)' : ''}</div>
          <div className={`clock ${clocks[1] <= 10000 ? 'low' : ''}`}>{fmt(clocks[1])}</div>
        </div>
      </div>

      <div className="piles bombs-layout">
        {piles.map((count, pileIdx) => {
          // build array from top(0) to bottom(count-1)
          const bombs = Array.from({ length: count }).map((_, i) => ({ topIndex: i }))
          return (
            <div key={pileIdx} className={`pile bomb-pile`}>
              <div className="pile-title">Pile {pileIdx + 1}</div>
              <div className="bomb-column">
                {bombs.map((b, idx) => {
                  // bombs array built from top(0) to bottom(count-1)
                  const isBlasting = blasts[pileIdx] !== undefined && idx <= blasts[pileIdx]
                  const canClick = status === 'playing' && winner === null
                  return (
                                  <div key={idx} style={{ position: 'relative' }}>
                                    <button
                                      className={`bomb ${isBlasting ? 'blast' : ''}`}
                                      onClick={() => { if (canClick) clickBomb(pileIdx, idx) }}
                        title={`Blast ${idx + 1} from top`}
                        aria-label={`bomb-${pileIdx}-${idx}`}
                      >
                        <svg viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <circle cx="11" cy="13" r="6" fill="#1f2937" stroke="#fde047" strokeWidth="0.8" />
                            <rect x="10" y="4" width="2" height="6" rx="1" fill="#f97316" />
                            <path d="M13 4 C14 2,16 1,18 2" stroke="#fbbf24" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                          </g>
                        </svg>
                        <span className="bomb-fuse" />
                      </button>
                      {/* particles */}
                      {isBlasting && (
                        <>
                          <div className="particle show" style={{ left: '30%', top: '30%', background: '#ffd166' }} />
                          <div className="particle show" style={{ left: '70%', top: '20%', background: '#ff8b8b' }} />
                          <div className="particle show" style={{ left: '50%', top: '10%', background: '#7ee787' }} />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="pile-count">{count}</div>
            </div>
          )
        })}
      </div>

      {status === 'finished' && (
        <div className="winner-modal">
          <div className="winner-card">
            <div className="celebrate">
              <svg className="firework" viewBox="0 0 120 120" aria-hidden>
                <g>
                  <circle cx="60" cy="30" r="6" fill="#ffd166" />
                  <circle cx="92" cy="48" r="4" fill="#ff8b8b" />
                  <circle cx="28" cy="48" r="4" fill="#7ee787" />
                </g>
              </svg>
            </div>
            <h1>Winner!</h1>
            <h2 className="winner-name">{players[winner] || 'Unknown'}</h2>
            <div className="winner-actions">
              <button className="primary" onClick={() => { onReset(); }}>Play Again</button>
              <button className="secondary" onClick={() => { terminate(); }}>Main Menu</button>
            </div>
            <div className="confetti-root">
              {Array.from({ length: 20 }).map((_, i) => {
                const left = Math.round(Math.random() * 100)
                const delay = (Math.random() * 0.6).toFixed(2)
                const dur = (1.2 + Math.random() * 1.2).toFixed(2)
                const colors = ['#ffd166','#ff8b8b','#7ee787','#60a5fa','#f0abfc']
                const bg = colors[i % colors.length]
                return <span key={i} className="confetti" style={{ left: `${left}%`, background: bg, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
