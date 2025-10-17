const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  piles: { type: [Number], default: [] },
  players: { type: Object, default: {} },
  turnOrder: { type: [String], default: [] },
  status: { type: String, default: 'waiting' },
  currentTurn: { type: Number, default: 0 },
  winner: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
