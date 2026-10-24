// game/ScoreManager.js
// Quản lý điểm, kho, xuất hàng (server-authoritative).
// Vòng lặp: thu hoạch → vào KHO (chưa điểm) → ban NGÀY xuất hàng → điểm.
// Client → Server: ship_goods {}
// Server → Client: warehouse_updated, score_updated, leaderboard_update

// Giá trị điểm mỗi nông sản khi xuất
const CROP_VALUES = {
  carrot: 2,
  corn: 5,
  pumpkin: 10,
};

class ScoreManager {
  constructor({ io, dayNightCycle }) {
    this.io = io;
    this.dayNightCycle = dayNightCycle;
    this.players = new Map(); // playerId -> { username, points, warehouse: {cropType: count} }
  }

  ensurePlayer(playerId, username) {
    if (!this.players.has(playerId)) {
      this.players.set(playerId, {
        username: username || playerId,
        points: 0,
        warehouse: {},
      });
    }
  }

  // Thu hoạch cộng vào kho (KHÔNG cộng điểm)
  addToWarehouse(playerId, cropType, count) {
    this.ensurePlayer(playerId);
    const p = this.players.get(playerId);
    p.warehouse[cropType] = (p.warehouse[cropType] || 0) + count;
    this.io.emit("warehouse_updated", {
      playerId,
      warehouse: { ...p.warehouse },
    });
  }

  // Xuất hàng: kho → điểm. CHỈ ban ngày.
  shipGoods(playerId) {
    this.ensurePlayer(playerId);
    if (this.dayNightCycle && !this.dayNightCycle.isDay()) {
      return { ok: false, error: "ONLY_DAY" };
    }
    const p = this.players.get(playerId);
    let totalPoints = 0;
    let totalCrops = 0;
    for (const [cropType, count] of Object.entries(p.warehouse)) {
      const value = CROP_VALUES[cropType] || 0;
      totalPoints += value * count;
      totalCrops += count;
    }
    if (totalCrops === 0) return { ok: false, error: "EMPTY_WAREHOUSE" };

    p.warehouse = {};
    p.points += totalPoints;
    this.io.emit("warehouse_updated", { playerId, warehouse: {} });
    this.io.emit("score_updated", { playerId, points: p.points, gained: totalPoints });
    this.broadcastLeaderboard();
    console.log(`[Score] ${p.username} xuất hàng: +${totalPoints} điểm (${totalCrops} nông sản)`);
    return { ok: true, points: totalPoints, crops: totalCrops };
  }

  // Cộng điểm trực tiếp (dùng cho PK, boss, bẫy... sau này)
  addPoints(playerId, amount, reason) {
    this.ensurePlayer(playerId);
    const p = this.players.get(playerId);
    p.points += amount;
    this.io.emit("score_updated", { playerId, points: p.points, gained: amount, reason });
    this.broadcastLeaderboard();
  }

  getPoints(playerId) {
    this.ensurePlayer(playerId);
    return this.players.get(playerId).points;
  }

  getLeaderboard() {
    return [...this.players.entries()]
      .map(([playerId, p]) => ({ playerId, username: p.username, points: p.points }))
      .sort((a, b) => b.points - a.points);
  }

  broadcastLeaderboard() {
    this.io.emit("leaderboard_update", { entries: this.getLeaderboard() });
  }

  // Tìm người thắng (cao điểm nhất)
  getWinner() {
    const lb = this.getLeaderboard();
    return lb.length > 0 ? lb[0] : null;
  }

  registerSocketHandlers(socket) {
    socket.on("ship_goods", () => {
      const res = this.shipGoods(socket.userId);
      socket.emit("ship_goods_result", res);
    });
    socket.on("request_score", () => {
      this.ensurePlayer(socket.userId, socket.username);
      const p = this.players.get(socket.userId);
      socket.emit("warehouse_updated", { playerId: socket.userId, warehouse: { ...p.warehouse } });
      socket.emit("score_updated", { playerId: socket.userId, points: p.points, gained: 0 });
      socket.emit("leaderboard_update", { entries: this.getLeaderboard() });
    });
  }
}

module.exports = { ScoreManager, CROP_VALUES };
