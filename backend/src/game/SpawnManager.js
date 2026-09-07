const SpawnPoint = require("../models/SpawnPoint");

class SpawnManager {
  constructor({ monsterManager, zoneManager }) {
    this.monsterManager = monsterManager;
    this.zoneManager = zoneManager;
    this.spawnPoints = new Map(); // spawnPointId -> spawnPoint doc
    this.checkInterval = null;
  }

  async initialize() {
    const points = await SpawnPoint.find({ isActive: true }).lean();
    this.spawnPoints.clear();
    for (const p of points) {
      this.spawnPoints.set(p._id.toString(), p);
    }
    console.log(`[SpawnManager] Loaded ${this.spawnPoints.size} spawn points`);
    this.startLoop();
  }

  async reload() {
    return this.initialize();
  }

  startLoop() {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      this.checkAllSpawnPoints();
    }, 5000); // check mỗi 5s
  }

  checkAllSpawnPoints() {
    for (const point of this.spawnPoints.values()) {
      // chỉ spawn ở zone đang có player (tối ưu, tránh spawn zone trống)
      const population = this.zoneManager.getPopulation(point.zoneId);
      if (population <= 0) continue;

      this.spawnFromPoint(point._id.toString());
    }
  }

  spawnFromPoint(spawnPointId) {
    const point = this.spawnPoints.get(spawnPointId);
    if (!point || !point.isActive) return null;

    const currentCount =
      this.monsterManager.getSpawnPointMonsterCount(spawnPointId);

    if (currentCount >= point.maxCount) return null;

    const offsetX = (Math.random() * 2 - 1) * point.radius;
    const offsetY = (Math.random() * 2 - 1) * point.radius;

    return this.monsterManager.spawnMonster({
      type: point.monsterType,
      zoneId: point.zoneId,
      x: point.x + offsetX,
      y: point.y + offsetY,
      spawnPointId,
    });
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

module.exports = SpawnManager;