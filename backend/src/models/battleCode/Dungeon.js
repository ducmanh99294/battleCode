const mongoose = require("mongoose");

const dungeonSchema = new mongoose.Schema({
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  enemies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Enemy"
  }],

  status: {
    type: String,
    enum: ["waiting", "playing", "finished"],
    default: "waiting"
  },

  logs: [String]

}, { timestamps: true });

module.exports = mongoose.model("Dungeon", dungeonSchema);