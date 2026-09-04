const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    // Tên item
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Mô tả
    description: {
      type: String,
      default: "",
      trim: true,
    },

    rarity: {
      type: String,
      enum: [
        "common",
        "uncommon",
        "rare",
        "epic",
        "legendary",
      ],
      default: "common",
    },

    // Loại item
    type: {
      type: String,
      enum: [
        "weapon",
        "armor",
        "helmet",
        "ring",
        "consumable",
        "material",
        "quest",
      ],
      required: true,
    },

    // Rarity
    rarity: {
      type: String,
      enum: [
        "common",
        "uncommon",
        "rare",
        "epic",
        "legendary",
      ],
      default: "common",
    },

    // Giá bán/mua cơ bản
    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Item có thể stack hay không
    stackable: {
      type: Boolean,
      default: true,
    },

    // Số lượng stack tối đa
    maxStack: {
      type: Number,
      default: 99,
      min: 1,
    },

    // Có thể sử dụng không
    usable: {
      type: Boolean,
      default: false,
    },

    // Có thể equip không
    equippable: {
      type: Boolean,
      default: false,
    },

    // Đường dẫn sprite/icon
    icon: {
      type: String,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | Item Effects
    |--------------------------------------------------------------------------
    |
    | Dùng cho consumable hoặc các effect khác.
    |
    | Ví dụ:
    |
    | {
    |   health: 50,
    |   mana: 20,
    |   energy: 10
    | }
    |
    */

    effect: {
      health: {
        type: Number,
        default: 0,
      },

      mana: {
        type: Number,
        default: 0,
      },

      energy: {
        type: Number,
        default: 0,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Equipment Stats
    |--------------------------------------------------------------------------
    |
    | Chỉ sử dụng khi item là equipment.
    |
    */

    stats: {
      STR: {
        type: Number,
        default: 0,
      },

      VIT: {
        type: Number,
        default: 0,
      },

      AGI: {
        type: Number,
        default: 0,
      },

      INT: {
        type: Number,
        default: 0,
      },

      END: {
        type: Number,
        default: 0,
      },

      LUK: {
        type: Number,
        default: 0,
      },

      attack: {
        type: Number,
        default: 0,
      },

      defense: {
        type: Number,
        default: 0,
      },

      maxHealth: {
        type: Number,
        default: 0,
      },

      maxMana: {
        type: Number,
        default: 0,
      },

      maxEnergy: {
        type: Number,
        default: 0,
      },

      criticalChance: {
        type: Number,
        default: 0,
      },

      criticalDamage: {
        type: Number,
        default: 0,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Level Requirement
    |--------------------------------------------------------------------------
    */

    requiredLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Item", itemSchema);
