import React, { useState, useRef, useEffect } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'
import { io } from 'socket.io-client'

export default function App() {
  const [gameProps, setGameProps] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const handleStart = (payload) => {
    if (payload.mode === 'local') {
      setGameProps({ mode: 'local', players: payload.players, pilesCount: Number(payload.piles) || 3, matchMinutes: Number(payload.minutes) || 6 })
      return
    }

    // online: connect socket and create/join room
    const server = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_SERVER || 'http://localhost:4000'
    const socket = io(server)
    socketRef.current = socket

    socket.on('connect', () => {
      if (payload.create) {
        socket.emit('join', { name: payload.name })
        setGameProps({ mode: 'online', socket, players: [payload.name, 'Waiting...'], roomId: null, pilesCount: Number(payload.piles) || 3, matchMinutes: Number(payload.minutes) || 6 })
      } else {
        socket.emit('join', { roomId: payload.roomId, name: payload.name })
        setGameProps({ mode: 'online', socket, players: [payload.name, 'Waiting...'], roomId: payload.roomId, pilesCount: Number(payload.piles) || 3, matchMinutes: Number(payload.minutes) || 6 })
      }
    })

    socket.on('room_update', ({ roomId, room }) => {
      if (!room) return
      // when two players present and room.status is playing, navigate to game state
      const playerNames = Object.values(room.players || {}).map(p => p.name || 'Player')
      const names = playerNames.slice(0, 2)
      if (names.length === 1) names.push('Waiting...')
      setGameProps((g) => ({ ...g, roomId, room, players: names }))
    })

    socket.on('error_msg', (m) => alert(m))
  }

  const handleReset = () => {
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
