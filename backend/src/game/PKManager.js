// game/PKManager.js
// PK giữa người chơi + đồ mang theo (carried loot) — server-authoritative.
// Quy tắc: CHỈ được PK khi (1) ban đêm VÀ (2) cả 2 đang ở dungeon.
// Chết ban đêm trong dungeon → rớt hết đồ đang mang (kẻ giết được nhặt).
// Client → Server: attack_player {targetId}, deposit_loot {}
// Server → Client: player_damaged, player_killed, carried_updated, loot_dropped_pk

const PK_DAMAGE = 20;       // sát thương mỗi đòn (tạm, sau này tính theo đồ)
const PK_KILL_POINTS = 25;  // điểm khi giết người
const MAX_CARRY = 10;       // tối đa mang theo

class PKManager {
  constructor({ io, playerManager, dayNightCycle, scoreManager }) {
    this.io = io;
    this.playerManager = playerManager;
    this.dayNightCycle = dayNightCycle;
    this.scoreManager = scoreManager;
    this.carried = new Map(); // playerId -> { cropType: count }
  }

  canPK() {
    return this.dayNightCycle && this.dayNightCycle.isNight();
  }

  isInDungeon(player) {
    return player?.position?.scene === "dungeon";
  }

  // ── CARRIED LOOT ──────────────────────────────────────────────────

  getCarried(playerId) {
    return this.carried.get(playerId) || {};
  }

  // Thêm đồ vào người mang (trả về số thực tế thêm được, giới hạn MAX_CARRY)
  addCarried(playerId, cropType, count) {
    const c = this.getCarried(playerId);
    const currentTotal = Object.values(c).reduce((a, b) => a + b, 0);
    const canAdd = Math.min(count, MAX_CARRY - currentTotal);
    if (canAdd <= 0) return 0;
    c[cropType] = (c[cropType] || 0) + canAdd;
    this.carried.set(playerId, c);
    this.io.emit("carried_updated", { playerId, carried: { ...c } });
    return canAdd;
  }

  // Mang về nhà → chuyển vào kho
  depositCarried(playerId) {
    const c = this.getCarried(playerId);
    const total = Object.values(c).reduce((a, b) => a + b, 0);
    if (total === 0) return { ok: false, error: "NOTHING_CARRIED" };
    for (const [cropType, count] of Object.entries(c)) {
      this.scoreManager.addToWarehouse(playerId, cropType, count);
    }
    this.carried.delete(playerId);
    this.io.emit("carried_updated", { playerId, carried: {} });
    console.log(`[PK] ${playerId} cất ${total} đồ trộm được vào kho`);
    return { ok: true, total };
  }

  // ── COMBAT ────────────────────────────────────────────────────────

  attackPlayer(attackerId, targetId) {
    if (attackerId === targetId)
      return { ok: false, error: "SELF" };
    if (!this.canPK())
      return { ok: false, error: "ONLY_NIGHT" };

    const attacker = this.playerManager.getPlayer(attackerId);
    const target = this.playerManager.getPlayer(targetId);
    if (!attacker || !target)
      return { ok: false, error: "NO_PLAYER" };
    if (!this.isInDungeon(attacker) || !this.isInDungeon(target))
      return { ok: false, error: "ONLY_DUNGEON" };

    // Trừ máu (dùng health.current của Player model)
    const targetHealth = target.health || { current: 100, max: 100 };
    targetHealth.current = Math.max(0, (targetHealth.current ?? 100) - PK_DAMAGE);
    if (target.health) target.health.current = targetHealth.current;

    this.io.emit("player_damaged", {
      attackerId, targetId,
      damage: PK_DAMAGE,
      hpLeft: targetHealth.current,
    });

    if (targetHealth.current <= 0) {
      this.handleDeath(targetId, attackerId);
      return { ok: true, killed: true };
    }
    return { ok: true, killed: false };
  }

  handleDeath(victimId, killerId) {
    // Rớt đồ đang mang → tạo loot cho kẻ giết nhặt (đơn giản: chuyển thẳng vào carried của killer)
    const dropped = this.getCarried(victimId);
    const droppedTotal = Object.values(dropped).reduce((a, b) => a + b, 0);
    this.carried.delete(victimId);

    if (droppedTotal > 0 && killerId) {
      const c = this.getCarried(killerId);
      for (const [cropType, count] of Object.entries(dropped)) {
        c[cropType] = (c[cropType] || 0) + count;
      }
      this.carried.set(killerId, c);
      this.io.emit("carried_updated", { playerId: killerId, carried: { ...c } });
    }

    // Hồi sinh: full máu (vị trí giữ nguyên, client tự xử lý)
    const victim = this.playerManager.getPlayer(victimId);
    if (victim?.health) victim.health.current = victim.health.max ?? 100;

    // Điểm cho kẻ giết
    if (killerId) {
      this.scoreManager.addPoints(killerId, PK_KILL_POINTS, "pk_kill");
    }

    console.log(`[PK] ${killerId} giết ${victimId} (rớt ${droppedTotal} đồ)`);
    this.io.emit("player_killed", {
      victimId, killerId, dropped, droppedTotal,
    });
    this.io.emit("carried_updated", { playerId: victimId, carried: {} });
  }

  registerSocketHandlers(socket) {
    socket.on("attack_player", ({ targetId }) => {
      const res = this.attackPlayer(socket.userId, targetId);
      socket.emit("attack_player_result", res);
    });
    socket.on("deposit_loot", () => {
      const res = this.depositCarried(socket.userId);
      socket.emit("deposit_loot_result", res);
    });
    socket.on("request_carried", () => {
      socket.emit("carried_updated", {
        playerId: socket.userId,
        carried: { ...this.getCarried(socket.userId) },
      });
    });
  }
}

module.exports = { PKManager, PK_DAMAGE, PK_KILL_POINTS, MAX_CARRY };
