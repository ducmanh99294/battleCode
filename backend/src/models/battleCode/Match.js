const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  status: {
    type: String,
    enum: ["waiting", "playing", "finished"],
    default: "waiting"
  },

  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  logs: [{
    type: String
  }]

}, { timestamps: true });

module.exports = mongoose.model("Match", matchSchema);