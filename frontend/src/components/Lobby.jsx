import React, { useState } from 'react'

export default function Lobby({ onStart }) {
  const [mode, setMode] = useState('local') // 'local' or 'online'
  const [p1, setP1] = useState('Player 1')
  const [p2, setP2] = useState('Player 2')
  const [piles, setPiles] = useState(3)
  const [minutes, setMinutes] = useState(6)
  const [roomId, setRoomId] = useState('')

  const startLocal = () => {
    if (!p1 || !p2) return alert('Enter both player names')
    const pc = Math.min(10, Math.max(1, Number(piles) || 3))
    const mm = Math.min(15, Math.max(3, Number(minutes) || 6))
    onStart({ mode: 'local', players: [p1, p2], piles: pc, minutes: mm })
  }

  const createRoom = () => {
    if (!p1) return alert('Enter your name')
    // generate a short room id
    const id = Math.random().toString(36).slice(2, 9)
    setRoomId(id)
    onStart({ mode: 'online', create: true, roomId: id, name: p1 })
  }

  const joinRoom = () => {
    if (!p1) return alert('Enter your name')
    if (!roomId) return alert('Enter room id')
    onStart({ mode: 'online', create: false, roomId, name: p1 })
  }

  return (
    <div className="card">
      <h1>NIM — Two Player</h1>
      <p>Play locally on the same device or create/join an online room to play from opposite ends.</p>

      <div className="field">
        <label>Mode</label>
        <div>
          <label><input type="radio" checked={mode==='local'} onChange={() => setMode('local')} /> Local</label>
          <label style={{ marginLeft: 12 }}><input type="radio" checked={mode==='online'} onChange={() => setMode('online')} /> Online</label>
        </div>
      </div>

      {mode === 'local' ? (
        <>
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
            <button onClick={startLocal} className="primary">Start Local Game</button>
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <label>Your name</label>
            <input value={p1} onChange={(e) => setP1(e.target.value)} />
          </div>
          <div className="field">
            <label>Room ID</label>
            <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="leave empty to create" />
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
            <button onClick={createRoom} className="primary">Create Room</button>
            <button onClick={joinRoom} className="secondary" style={{ marginLeft: 8 }}>Join Room</button>
          </div>
          {roomId && <div style={{ marginTop: 8 }}>Share this room id with your friend: <strong>{roomId}</strong></div>}
        </>
      )}
    </div>
  )
}
