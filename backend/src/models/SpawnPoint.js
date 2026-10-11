const mongoose = require("mongoose");

const spawnPointSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      trim: true,
    },
    monsterType: {
      type: String,
      required: true,
      trim: true,
    },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    radius: {
      type: Number,
      default: 2,
      min: 0,
    },
    maxCount: {
      type: Number,
      default: 3,
      min: 1,
    },
    respawnTime: {
      type: Number,
      default: 10,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SpawnPoint", spawnPointSchema);