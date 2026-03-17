const mongoose = require("mongoose");

const actionLogSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Match"
  },

  turn: Number,

  actorId: {
    type: mongoose.Schema.Types.ObjectId
  },

  actionType: {
    type: String,
    enum: ["attack", "heal"]
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },

  value: Number

}, { timestamps: true });

module.exports = mongoose.model("ActionLog", actionLogSchema);