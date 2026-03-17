const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { runCode } = require("../services/sandbox");
const { processTurn } = require("../services/combat/combatEngine");
const { validateAction } = require("../services/gameLogic");

const activeDungeons = global.activeDungeons || (global.activeDungeons = {});

exports.handlePlayerAction = async (socket, data) => {
  try {
    const { dungeonId, code } = data;
    const userId = socket.userId;

    const dungeon = activeDungeons[dungeonId];
    if (!dungeon) throw new Error("Dungeon not found");

    const player = dungeon.players.find(p => p.userId === userId);
    if (!player || player.hp <= 0) {
      throw new Error("Player is dead or not in dungeon");
    }

    // run code
    let action;
    try {
      action = await runCode(code, dungeon, player);
    } catch (err) {
      dungeon.logs.push(`❌ Code error: ${err.message}`);
      return dungeon;
    }

    // validate
    if (!validateAction(action, dungeon, player)) {
      dungeon.logs.push("❌ Invalid action");
      return dungeon;
    }

    // combat
    const updated = processTurn(dungeon, userId, action);

    activeDungeons[dungeonId] = updated;

    return updated;

  } catch (err) {
    return { error: err.message };
  }
};

module.exports = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.isBanned) {
      return res.status(403).json({
        message: "User is banned",
        reason: user.banReason
      });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
