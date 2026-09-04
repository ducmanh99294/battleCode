const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
    },

    exp: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxExp: {
      type: Number,
      default: 100,
      min: 1,
    },

    stats: {
      STR: {
        type: Number,
        default: 10,
        min: 0,
      },
      VIT: {
        type: Number,
        default: 10,
        min: 0,
      },
      AGI: {
        type: Number,
        default: 10,
        min: 0,
      },
      INT: {
        type: Number,
        default: 10,
        min: 0,
      },
      END: {
        type: Number,
        default: 10,
        min: 0,
      },
      LUK: {
        type: Number,
        default: 10,
        min: 0,
      },
    },

    health: {
      current: {
        type: Number,
        default: 100,
        min: 0,
      },
      max: {
        type: Number,
        default: 100,
        min: 1,
      },
    },

    mana: {
      current: {
        type: Number,
        default: 100,
        min: 0,
      },
      max: {
        type: Number,
        default: 100,
        min: 1,
      },
    },

    energy: {
      current: {
        type: Number,
        default: 100,
        min: 0,
      },
      max: {
        type: Number,
        default: 100,
        min: 1,
      },
    },

    gold: {
      type: Number,
      default: 0,
      min: 0,
    },

    position: {
      x: {
        type: Number,
        default: 0,
      },
      y: {
        type: Number,
        default: 0,
      },
      scene: {
        type: String,
        default: "StartScene",
      },
    },

    learnedSkills: [
      {
        skillId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill",
          required: true,
        },
        level: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],

inventory: [
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    amount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
],

    equippedItems: {
      weapon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },

      armor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },

      helmet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },

      ring: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },
    },

    quests: [
      {
        questId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quest",
          required: true,
        },

        status: {
          type: String,
          enum: ["not_started", "active", "completed", "failed"],
          default: "not_started",
        },

        timeLeft: {
          type: Number,
          default: 0,
          min: 0,
        },

        objectives: [
          {
            objectiveId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },

            current: {
              type: Number,
              default: 0,
              min: 0,
            },

            required: {
              type: Number,
              default: 1,
              min: 1,
            },

            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],

    attributePoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    playtime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Player", playerSchema);