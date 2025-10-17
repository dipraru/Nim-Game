import React, { useState } from 'react'

export default function Lobby({ onStart }) {
  const [p1, setP1] = useState('Player 1')
  const [p2, setP2] = useState('Player 2')
  const [piles, setPiles] = useState(3)
  const [minutes, setMinutes] = useState(6)

  const start = () => {
    if (!p1 || !p2) return alert('Enter both player names')
    const pc = Math.min(10, Math.max(1, Number(piles) || 3))
    const mm = Math.min(15, Math.max(3, Number(minutes) || 6))
    console.log('Lobby.start ->', { p1, p2, piles: pc, minutes: mm })
    try {
      onStart(p1, p2, pc, mm)
    } catch (err) {
      console.error('onStart threw:', err)
      throw err
    }
  }

  return (
    <div className="card">
      <h1>NIM — Two Player (Local)</h1>
      <p>Two players can play from the same device. Enter both names and choose piles (max 10).</p>
      <div className="field">
        <label>Player 1</label>
        <input value={p1} onChange={(e) => setP1(e.target.value)} />
      </div>
      <div className="field">
        <label>Player 2</label>
        <input value={p2} onChange={(e) => setP2(e.target.value)} />
      </div>
      <div className="field">
        <label>Number of piles (1-10)</label>
        <input type="number" min="1" max="10" value={piles} onChange={(e) => setPiles(e.target.value)} />
      </div>
      <div className="field">
        <label>Match length (minutes, 3-15)</label>
        <input type="number" min="3" max="15" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
      </div>
      <div className="actions">
        <button onClick={start} className="primary">Start Game</button>
      </div>
    </div>
  )
}
