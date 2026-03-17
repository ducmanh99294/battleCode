const mongoose = require("mongoose");

const effectSchema = new mongoose.Schema({
  type: String,
  duration: Number
}, { _id: false });

const playerStateSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Match"
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  hp: {
    type: Number,
    default: 100
  },

  mana: {
    type: Number,
    default: 50
  },

  attack: {
    type: Number,
    default: 10
  },

  defense: {
    type: Number,
    default: 5
  },

  speed: {
    type: Number,
    default: 5
  },

  isAlive: {
    type: Boolean,
    default: true
  },

  effects: [effectSchema]

}, { timestamps: true });

module.exports = mongoose.model("PlayerState", playerStateSchema);