// game/StealManager.js
// Trộm cắp kho nhà người khác (server-authoritative).
// Quy tắc: CHỈ ban đêm. Kẻ trộm phải đang ở NHÀ CỦA NẠN NHÂN
// (đi qua đường hầm — TunnelManager ghi nhận vị trí).
// Trộm được → vào đồ mang theo (carried), mang về nhà mình mới thành kho.
// Client → Server: steal {targetPlayerId}
// Server → Client: steal_result, steal_alert (báo cho nạn nhân)

const STEAL_PER_TRIP = 3; // tối đa trộm mỗi lần

class StealManager {
  constructor({ io, playerManager, dayNightCycle, scoreManager, pkManager, tunnelManager }) {
    this.io = io;
    this.playerManager = playerManager;
    this.dayNightCycle = dayNightCycle;
    this.scoreManager = scoreManager;
    this.pkManager = pkManager;
    this.tunnelManager = tunnelManager;
  }

  steal(thiefId, targetPlayerId) {
    if (thiefId === targetPlayerId)
      return { ok: false, error: "SELF" };
    if (!this.dayNightCycle?.isNight())
      return { ok: false, error: "ONLY_NIGHT" };

    // Kẻ trộm phải đang ở nhà nạn nhân
    const location = this.tunnelManager.getPlayerLocation(thiefId);
    if (location !== targetPlayerId)
      return { ok: false, error: "NOT_AT_HOUSE" };

    // Lấy kho nạn nhân
    this.scoreManager.ensurePlayer(targetPlayerId);
    const victim = this.scoreManager.players.get(targetPlayerId);
    const warehouse = victim.warehouse || {};
    const totalCrops = Object.values(warehouse).reduce((a, b) => a + b, 0);
    if (totalCrops === 0)
      return { ok: false, error: "EMPTY_WAREHOUSE" };

    // Trộm tối đa STEAL_PER_TRIP (ưu tiên loại giá trị cao trước)
    const { CROP_VALUES } = require("./ScoreManager");
    const sorted = Object.entries(warehouse)
      .filter(([, count]) => count > 0)
      .sort((a, b) => (CROP_VALUES[b[0]] || 0) - (CROP_VALUES[a[0]] || 0));

    let stolenTotal = 0;
    const stolen = {};
    for (const [cropType, count] of sorted) {
      if (stolenTotal >= STEAL_PER_TRIP) break;
      const want = Math.min(count, STEAL_PER_TRIP - stolenTotal);
      // Trừ kho nạn nhân
      victim.warehouse[cropType] -= want;
      if (victim.warehouse[cropType] <= 0) delete victim.warehouse[cropType];
      // Cộng vào đồ mang theo (có giới hạn)
      const added = this.pkManager.addCarried(thiefId, cropType, want);
      // Nếu mang không hết (đầy), trả lại kho
      const leftover = want - added;
      if (leftover > 0) {
        victim.warehouse[cropType] = (victim.warehouse[cropType] || 0) + leftover;
      }
      if (added > 0) {
        stolen[cropType] = (stolen[cropType] || 0) + added;
        stolenTotal += added;
      }
    }

    if (stolenTotal === 0)
      return { ok: false, error: "CARRY_FULL" };

    // Cập nhật kho nạn nhân cho mọi người
    this.io.emit("warehouse_updated", {
      playerId: targetPlayerId,
      warehouse: { ...victim.warehouse },
    });

    // Báo động cho nạn nhân (biết mình bị trộm — nhưng không biết ai nếu muốn giấu)
    this.io.emit("steal_alert", {
      victimId: targetPlayerId,
      stolen,
      stolenTotal,
    });

    const thief = this.scoreManager.players.get(thiefId);
    console.log(`[Steal] ${thief?.username || thiefId} trộm ${stolenTotal} từ ${victim.username}`);
    return { ok: true, stolen, stolenTotal };
  }

  registerSocketHandlers(socket) {
    socket.on("steal", ({ targetPlayerId }) => {
      const res = this.steal(socket.userId, targetPlayerId);
      socket.emit("steal_result", res);
    });
  }
}

module.exports = { StealManager, STEAL_PER_TRIP };
