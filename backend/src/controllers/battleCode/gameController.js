const { runCode } = require("../../services/sandbox");
const { processTurn } = require("../../services/combat/combatEngine");
const { validateAction } = require("../../services/gameLogic");

// giả sử bạn đang lưu dungeon trong memory
const activeDungeons = global.activeDungeons || (global.activeDungeons = {});

/**
 * Xử lý action của player
 */
exports.handlePlayerAction = async (socket, data) => {
  try {
    const { dungeonId, code } = data;

    const userId = socket.userId; // phải set từ middleware auth

    if (!dungeonId || !code) {
      throw new Error("Missing dungeonId or code");
    }

    const dungeon = activeDungeons[dungeonId];

    if (!dungeon) {
      throw new Error("Dungeon not found");
    }

    // ❌ không cho người chết đánh
    const player = dungeon.players.find(p => p.userId === userId);
    if (!player || player.hp <= 0) {
      throw new Error("Player is dead or not in dungeon");
    }

    // 🧠 1. chạy code Python
    let action;
    try {
      action = await runCode(code, dungeon, player);
    } catch (err) {
      return {
        ...dungeon,
        logs: [...dungeon.logs, `❌ Code error: ${err.message}`]
      };
    }

    // 🛡️ 2. validate action
    const isValid = validateAction(action, dungeon, player);

    if (!isValid) {
      return {
        ...dungeon,
        logs: [...dungeon.logs, `❌ Invalid action`]
      };
    }

    // ⚔️ 3. xử lý combat
    const updatedDungeon = processTurn(dungeon, userId, action);

    // 💾 update lại memory
    activeDungeons[dungeonId] = updatedDungeon;

    return updatedDungeon;

  } catch (err) {
    console.error("handlePlayerAction error:", err.message);

    return {
      error: err.message
    };
  }
};