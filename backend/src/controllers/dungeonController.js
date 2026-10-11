// controllers/dungeonController.js
//
// POST /api/dungeon/enter
//
// Client (sau khi tự sinh layout dungeon) gửi:
// {
//   "tier": 1,
//   "seed": 123456,
//   "spawnPoints": [{ "x": 10.5, "y": 20.5 }, ...]
// }
//
// ANTI-CHEAT:
// - Client KHÔNG được chọn loại quái, chỉ số, EXP — server chọn hết.
// - Server validate: tier hợp lệ, số điểm spawn <= max, tọa độ trong bounds,
//   các điểm cách nhau tối thiểu, đều là số hữu hạn.
// - Quái spawn vào zone hiện tại của player (client phải SendSceneChanged
//   trước để vào zone dungeon).

const { getTier, pickTypes } = require("../game/DungeonTiers");

const enterDungeon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tier, seed, spawnPoints } = req.body;

    // 1. Validate tier

    const tierConfig = getTier(tier);

    if (!tierConfig) {
      return res.status(400).json({
        success: false,
        reason: "INVALID_TIER",
      });
    }

    // 2. Validate spawnPoints

    if (
      !Array.isArray(spawnPoints) ||
      spawnPoints.length === 0 ||
      spawnPoints.length > tierConfig.maxMonsters
    ) {
      return res.status(400).json({
        success: false,
        reason: "INVALID_SPAWN_POINTS",
      });
    }

    const points = [];

    for (const p of spawnPoints) {
      const x = Number(p?.x);
      const y = Number(p?.y);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return res.status(400).json({
          success: false,
          reason: "INVALID_COORDINATE",
        });
      }

      if (Math.abs(x) > tierConfig.bounds || Math.abs(y) > tierConfig.bounds) {
        return res.status(400).json({
          success: false,
          reason: "OUT_OF_BOUNDS",
        });
      }

      for (const q of points) {
        const dx = x - q.x;
        const dy = y - q.y;

        if (dx * dx + dy * dy < tierConfig.minSpacing * tierConfig.minSpacing) {
          return res.status(400).json({
            success: false,
            reason: "SPAWN_TOO_CLOSE",
          });
        }
      }

      points.push({ x, y });
    }

    // 3. Lấy runtime player (phải đang online trong zone dungeon)

    const playerManager = req.app.get("playerManager");
    const monsterManager = req.app.get("monsterManager");

    if (!playerManager || !monsterManager) {
      return res.status(500).json({
        success: false,
        reason: "SERVER_NOT_READY",
      });
    }

    const player = playerManager.getPlayer(userId);

    if (!player || !player.zoneId) {
      return res.status(400).json({
        success: false,
        reason: "JOIN_DUNGEON_ZONE_FIRST",
      });
    }

    // 4. Server chọn loại quái (client không được chọn)

    const types = pickTypes(tierConfig, points.length);
    const monsters = [];

    for (let i = 0; i < points.length; i++) {
      const m = monsterManager.spawnDungeonMonster({
        type: types[i],
        zoneId: player.zoneId,
        x: points[i].x,
        y: points[i].y,
      });

      if (m) monsters.push(toTemplateData(m));
    }

    console.log(
      `[Dungeon] ${playerManager.getPlayer(userId)?.username || userId} ` +
      `vào tầng ${tier} (seed=${seed}): spawn ${monsters.length}/${points.length} quái`
    );

    return res.status(200).json({
      success: true,
      tier,
      seed,
      monsters,
    });
  } catch (error) {
    console.error("enterDungeon error:", error);

    return res.status(500).json({
      success: false,
      reason: "SERVER_ERROR",
    });
  }
};

// Đúng shape MonsterTemplateData mà Unity MonsterSpawnManager đọc
function toTemplateData(m) {
  return {
    monsterId: m.monsterId,
    type: m.type,
    displayName: m.displayName,
    maxHp: m.maxHp,
    damage: m.damage,
    speed: m.speed,
    detectRange: m.detectRange,
    attackRange: m.attackRange,
    expReward: m.expReward,
    spawnX: m.position.x,
    spawnY: m.position.y,
  };
}

module.exports = {
  enterDungeon,
};
