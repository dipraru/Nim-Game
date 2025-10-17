import React, { useState, useRef } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'
import { io } from 'socket.io-client'

export default function App() {
  const [gameProps, setGameProps] = useState(null)
  const socketRef = useRef(null)

  const handleStart = (payload) => {
    if (payload.mode === 'local') {
      setGameProps({ mode: 'local', players: payload.players, pilesCount: Number(payload.piles) || 3, matchMinutes: Number(payload.minutes) || 6 })
      return
    }

    // online: connect socket and join/create room
    const server = import.meta.env.VITE_SERVER || 'http://localhost:4000'
    const socket = io(server)
    socketRef.current = socket
    socket.on('connect', () => {
      socket.emit('join', { roomId: payload.roomId, name: payload.name })
      setGameProps({ mode: 'online', socket, players: [payload.name, 'Waiting...'], roomId: payload.roomId, pilesCount: Number(payload.piles) || 3, matchMinutes: Number(payload.minutes) || 6 })
    })
    socket.on('room_update', ({ roomId, room }) => {
      // update players/piles via Game component; Game will listen to socket directly
      // we keep gameProps so Game has socket reference
      setGameProps((g) => ({ ...g, roomId, room }))
    })
  }

  const handleReset = () => {
    // cleanup socket if present
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setGameProps(null)
  }

  return (
    <div className="app">
      <div className="container">
        {!gameProps ? (
            <Lobby onStart={handleStart} />
          ) : (
            <Game {...gameProps} onReset={handleReset} />
          )}
      </div>
    </div>
  )
}
