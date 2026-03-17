const mongoose = require("mongoose");

const enemySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  hp: Number,
  attack: Number,
  defense: Number,
  speed: Number,

  skills: [String]

}, { timestamps: true });

module.exports = mongoose.model("Enemy", enemySchema);