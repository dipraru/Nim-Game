require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Simple in-memory rooms for demo. For production, use DB or Redis.
const rooms = {};

// Optional MongoDB connection
if (process.env.MONGO_URI) {
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.warn('MongoDB connection failed:', err.message));
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

function createInitialPiles() {
  // Classic 3-pile Nim with random sizes 3-7
  return [Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3];
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', ({ roomId, name }) => {
    if (!roomId) roomId = socket.id;
    socket.join(roomId);
    rooms[roomId] = rooms[roomId] || { players: {}, piles: createInitialPiles(), turnOrder: [], status: 'waiting' };
    const room = rooms[roomId];
    room.players[socket.id] = { id: socket.id, name: name || 'Player' };
    if (!room.turnOrder.includes(socket.id)) room.turnOrder.push(socket.id);

    // start when 2 players
    if (Object.keys(room.players).length >= 2 && room.status === 'waiting') {
      room.status = 'playing';
      room.currentTurn = 0; // index into turnOrder
    }

    io.to(roomId).emit('room_update', { roomId, room });
  });

  socket.on('make_move', ({ roomId, pileIndex, take }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;
    const playerId = socket.id;
    const currentPlayerId = room.turnOrder[room.currentTurn % room.turnOrder.length];
    if (playerId !== currentPlayerId) {
      socket.emit('error_msg', 'Not your turn');
      return;
    }
    if (pileIndex < 0 || pileIndex >= room.piles.length) return;
    if (take <= 0 || take > room.piles[pileIndex]) return;
    room.piles[pileIndex] -= take;

    // check win: all zero
    const allZero = room.piles.every((p) => p === 0);
    if (allZero) {
      room.status = 'finished';
      room.winner = playerId;
    } else {
      room.currentTurn = (room.currentTurn + 1) % room.turnOrder.length;
    }

    io.to(roomId).emit('room_update', { roomId, room });
  });

  socket.on('restart', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.piles = createInitialPiles();
    room.status = 'playing';
    room.winner = null;
    room.currentTurn = 0;
    io.to(roomId).emit('room_update', { roomId, room });
  });

  socket.on('disconnecting', () => {
    const roomsLeft = Array.from(socket.rooms).filter((r) => r !== socket.id);
    roomsLeft.forEach((roomId) => {
      const room = rooms[roomId];
      if (!room) return;
      delete room.players[socket.id];
      room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
      if (Object.keys(room.players).length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('room_update', { roomId, room });
      }
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
