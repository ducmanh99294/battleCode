const Monster = require("../models/Monster");

// GET ALL MONSTERS
exports.getMonsters = async (req, res) => {
  try {
    const monsters = await Monster.find()
      .sort({ isBoss: 1, type: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: monsters.length,
      monsters,
    });
  } catch (error) {
    console.error("Get monsters error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET MONSTER BY TYPE
exports.getMonsterByType = async (req, res) => {
  try {
    const { type } = req.params;

    const monster = await Monster.findOne({
      type: type.trim(),
    }).lean();

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: "Monster not found",
      });
    }

    return res.status(200).json({
      success: true,
      monster,
    });
  } catch (error) {
    console.error("Get monster error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// CREATE MONSTER
exports.createMonster = async (req, res) => {
  try {
    const {
      type,
      displayName,
      maxHp,
      damage,
      speed,
      detectRange,
      attackRange,
      attackCooldown,
      expReward,
      dropTable,
      spawnZones,
      isBoss,
    } = req.body;

    if (!type || !displayName) {
      return res.status(400).json({
        success: false,
        message: "type and displayName are required",
      });
    }

    const existingMonster = await Monster.findOne({
      type: type.trim(),
    });

    if (existingMonster) {
      return res.status(409).json({
        success: false,
        message: "Monster type already exists",
      });
    }

    const monster = await Monster.create({
      type: type.trim(),
      displayName: displayName.trim(),

      maxHp,
      damage,
      speed,
      detectRange,
      attackRange,
      attackCooldown,
      expReward,

      dropTable: dropTable || [],
      spawnZones: spawnZones || [],

      isBoss: isBoss || false,
    });

    return res.status(201).json({
      success: true,
      message: "Monster created successfully",
      monster,
    });
  } catch (error) {
    console.error("Create monster error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// UPDATE MONSTER
exports.updateMonster = async (req, res) => {
  try {
    const { type } = req.params;

    const allowedFields = [
      "displayName",
      "maxHp",
      "damage",
      "speed",
      "detectRange",
      "attackRange",
      "attackCooldown",
      "expReward",
      "dropTable",
      "spawnZones",
      "isBoss",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const monster = await Monster.findOneAndUpdate(
      { type: type.trim() },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: "Monster not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Monster updated successfully",
      monster,
    });
  } catch (error) {
    console.error("Update monster error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// DELETE MONSTER
exports.deleteMonster = async (req, res) => {
  try {
    const { type } = req.params;

    const monster = await Monster.findOneAndDelete({
      type: type.trim(),
    });

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: "Monster not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Monster deleted successfully",
    });
  } catch (error) {
    console.error("Delete monster error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};