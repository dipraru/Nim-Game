import React, { useState } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'

export default function App() {
  const [players, setPlayers] = useState(null)
  const [pilesCount, setPilesCount] = useState(3)
  const [matchMinutes, setMatchMinutes] = useState(6)

  return (
    <div className="app">
      <div className="container">
        {!players ? (
            <Lobby onStart={(p1, p2, pc, mm) => { setPlayers([p1, p2]); setPilesCount(Number(pc) || 3); setMatchMinutes(Number(mm) || 6); }} />
          ) : (
            <Game players={players} pilesCount={Number(pilesCount) || 3} matchMinutes={Number(matchMinutes) || 6} onReset={() => setPlayers(null)} />
          )}
      </div>
    </div>
  )
}
