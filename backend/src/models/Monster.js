const mongoose = require("mongoose");

const dropTableSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      trim: true,
    },

    chance: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    minAmount: {
      type: Number,
      min: 1,
      default: 1,
    },

    maxAmount: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

const spawnZoneSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      trim: true,
    },

    maxCount: {
      type: Number,
      min: 1,
      default: 5,
    },

    respawnTime: {
      type: Number,
      min: 0,
      default: 10,
    },
  },
  { _id: false }
);

const monsterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    maxHp: {
      type: Number,
      required: true,
      min: 1,
    },

    damage: {
      type: Number,
      required: true,
      min: 0,
    },

    speed: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },

    detectRange: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },

    attackRange: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },

    attackCooldown: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },

    expReward: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    dropTable: {
      type: [dropTableSchema],
      default: [],
    },

    spawnZones: {
      type: [spawnZoneSchema],
      default: [],
    },

    isBoss: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Monster", monsterSchema);