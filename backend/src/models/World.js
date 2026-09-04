const mongoose = require("mongoose");

const worldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: "MainWorld",
    },

    currentMinute: {
      type: Number,
      required: true,
      min: 0,
      max: 1439,
      default: 720,
    },

    day: {
      type: Number,
      default: 1,
      min: 1,
    },

    weather: {
      type: String,
      enum: [
        "clear",
        "cloudy",
        "rain",
        "storm",
        "snow",
        "fog",
      ],
      default: "clear",
    },

    moon: {
      isFullMoon: {
        type: Boolean,
        default: false,
      },

      phase: {
        type: String,
        enum: [
          "new",
          "waxing_crescent",
          "first_quarter",
          "waxing_gibbous",
          "full",
          "waning_gibbous",
          "last_quarter",
          "waning_crescent",
        ],
        default: "new",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("World", worldSchema);