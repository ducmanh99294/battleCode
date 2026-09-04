const crypto = require("crypto");
const Monster = require("../models/Monster");

class MonsterManager {
  constructor(io) {
    this.io = io;

    // Monster templates
    //
    // type -> MongoDB Monster document
    //
    // slime -> {
    //   maxHp: 300,
    //   damage: 10,
    //   ...
    // }
    //
    this.lootManager =lootManager;

    this.templates = new Map();

    // Runtime monsters
    //
    // monsterId -> runtime monster
    //
    this.monsters = new Map();

    // Spawn counters
    //
    // zoneId -> Map<monsterType, count>
    //
    this.zoneCounts = new Map();

    this.initialized = false;
  }

  // INITIALIZE

  async initialize() {
    try {
      console.log("[MonsterManager] Loading monster templates...");

      const monsters = await Monster.find().lean();

      this.templates.clear();

      for (const monster of monsters) {
        this.templates.set(monster.type, monster);
      }

      console.log(
        `[MonsterManager] Loaded ${this.templates.size} monster templates`
      );

      this.initialized = true;

      return true;
    } catch (error) {
      console.error(
        "[MonsterManager] Initialize error:",
        error
      );

      throw error;
    }
  }

  // RELOAD TEMPLATES

  async reloadTemplates() {
    return this.initialize();
  }

  // GET TEMPLATE

  getTemplate(type) {
    return this.templates.get(type);
  }

  // GET MONSTER

  getMonster(monsterId) {
    return this.monsters.get(monsterId);
  }

  // GET MONSTERS IN ZONE

  getMonstersInZone(zoneId) {
    const result = [];

    for (const monster of this.monsters.values()) {
      if (
        monster.zoneId === zoneId &&
        monster.alive
      ) {
        result.push(monster);
      }
    }

    return result;
  }

  // SPAWN MONSTER

  spawnMonster({
    type,
    zoneId,
    x = 0,
    y = 0,
  }) {
    const template = this.templates.get(type);

    if (!template) {
      console.error(
        `[MonsterManager] Monster template not found: ${type}`
      );

      return null;
    }

    // Check spawn limit
    const zone = template.spawnZones?.find(
      (spawnZone) => spawnZone.zoneId === zoneId
    );

    if (!zone) {
      console.error(
        `[MonsterManager] Monster ${type} cannot spawn in zone ${zoneId}`
      );

      return null;
    }

    const currentCount = this.getZoneMonsterCount(
      zoneId,
      type
    );

    if (currentCount >= zone.maxCount) {
      return null;
    }

    // Generate runtime ID

    const monsterId = crypto.randomUUID();

    // Runtime state

    const monster = {
      monsterId,

      // Template reference
      type: template.type,

      displayName: template.displayName,

      // Combat
      hp: template.maxHp,
      maxHp: template.maxHp,

      damage: template.damage,

      speed: template.speed,

      detectRange: template.detectRange,

      attackRange: template.attackRange,

      attackCooldown: template.attackCooldown,

      expReward: template.expReward,

      // Drop
      dropTable: template.dropTable || [],

      // World
      zoneId,

      position: {
        x,
        y,
      },

      // State
      alive: true,

      targetPlayerId: null,

      lastAttackTime: 0,

      spawnedAt: Date.now(),

      // Respawn
      respawnTime: zone.respawnTime || 10,
    };

    this.monsters.set(
      monsterId,
      monster
    );

    this.incrementZoneCount(
      zoneId,
      type
    );

    console.log(
      `[MonsterManager] Spawned ${type} (${monsterId}) in ${zoneId}`
    );

    // Broadcast spawn

    this.broadcastMonsterSpawn(
      monster
    );

    return monster;
  }

  // REMOVE MONSTER

  removeMonster(monsterId) {
    const monster = this.monsters.get(
      monsterId
    );

    if (!monster) {
      return false;
    }

    this.decrementZoneCount(
      monster.zoneId,
      monster.type
    );

    this.monsters.delete(
      monsterId
    );

    return true;
  }

  // DAMAGE MONSTER

  damageMonster({
    monsterId,
    damage,
    attackerId = null,
  }) {
    const monster = this.monsters.get(
      monsterId
    );

    if (!monster) {
      return {
        success: false,
        message: "Monster not found",
      };
    }

    // Monster already dead

    if (!monster.alive) {
      return {
        success: false,
        message: "Monster is already dead",
      };
    }

    // IMPORTANT
    //
    // damage MUST already be calculated
    // by trusted server logic.
    //
    // Never call this with damage directly
    // from Unity.

    const safeDamage = Math.max(
      0,
      Math.floor(Number(damage) || 0)
    );

    if (safeDamage <= 0) {
      return {
        success: false,
        message: "Invalid damage",
      };
    }

    // Apply damage

    monster.hp = Math.max(
      0,
      monster.hp - safeDamage
    );

    const killed =
      monster.hp <= 0;

    if (killed) {
      monster.alive = false;
      monster.targetPlayerId = null;
    }

    // Broadcast damage

    this.broadcastMonsterDamaged({
      monsterId: monster.monsterId,
      hp: monster.hp,
      maxHp: monster.maxHp,
      damage: safeDamage,
      attackerId,
      killed,
    });

    // Death

    if (killed) {
      this.handleMonsterDeath(
        monster,
        attackerId
      );
    }

    return {
      success: true,
      monsterId: monster.monsterId,
      hp: monster.hp,
      maxHp: monster.maxHp,
      damage: safeDamage,
      killed,
    };
  }

  // MONSTER DEATH

  handleMonsterDeath(
    monster,
    killerId
  ) {
    const drops =
      this.calculateDrops(
        monster.dropTable
      );

    // CREATE LOOT

    if (
      this.lootManager &&
      drops.length > 0
    ) {
      this.lootManager.spawnDrops({
        drops,

        zoneId:
          monster.zoneId,

        x:
          monster.position.x,

        y:
          monster.position.y,

        ownerId:
          killerId,
      });
    }

    // MONSTER KILLED

    this.io
      .to(monster.zoneId)
      .emit(
        "monster_killed",
        {
          monsterId:
            monster.monsterId,

          killerId,

          expReward:
            monster.expReward,
        }
      );

    // DECREASE COUNT

    this.decrementZoneCount(
      monster.zoneId,
      monster.type
    );

    // RESPAWN

    const respawnTime =
      monster.respawnTime;

    setTimeout(() => {
      this.respawnMonster(
        monster
      );
    }, respawnTime * 1000);
  }

  // RESPAWN

  respawnMonster(oldMonster) {
    // Monster object may have been removed
    // or template may have changed.

    const template = this.templates.get(
      oldMonster.type
    );

    if (!template) {
      console.warn(
        `[MonsterManager] Cannot respawn ${oldMonster.type}: template not found`
      );

      return;
    }

    // Check spawn zone

    const zone = template.spawnZones?.find(
      (spawnZone) =>
        spawnZone.zoneId ===
        oldMonster.zoneId
    );

    if (!zone) {
      return;
    }

    // Spawn new monster

    this.spawnMonster({
      type: oldMonster.type,

      zoneId: oldMonster.zoneId,

      x: oldMonster.position.x,

      y: oldMonster.position.y,
    });
  }

  // CALCULATE DROPS

  calculateDrops(dropTable) {
    const drops = [];

    if (!Array.isArray(dropTable)) {
      return drops;
    }

    for (const drop of dropTable) {
      const roll = Math.random();

      if (roll > drop.chance) {
        continue;
      }

      const min =
        drop.minAmount || 1;

      const max =
        drop.maxAmount || min;

      const amount =
        Math.floor(
          Math.random() *
            (max - min + 1)
        ) + min;

      drops.push({
        itemId: drop.itemId,
        amount,
      });
    }

    return drops;
  }

  // UPDATE MONSTER POSITION

  updateMonsterPosition(
    monsterId,
    x,
    y
  ) {
    const monster = this.monsters.get(
      monsterId
    );

    if (!monster || !monster.alive) {
      return false;
    }

    monster.position.x = x;
    monster.position.y = y;

    return true;
  }

  // SET TARGET

  setTarget(
    monsterId,
    playerId
  ) {
    const monster = this.monsters.get(
      monsterId
    );

    if (!monster || !monster.alive) {
      return false;
    }

    monster.targetPlayerId =
      playerId;

    return true;
  }

  // CLEAR TARGET

  clearTarget(monsterId) {
    const monster = this.monsters.get(
      monsterId
    );

    if (!monster) {
      return false;
    }

    monster.targetPlayerId = null;

    return true;
  }

  // CHECK ATTACK COOLDOWN

  canAttack(monsterId) {
    const monster = this.monsters.get(
      monsterId
    );

    if (!monster || !monster.alive) {
      return false;
    }

    const now = Date.now();

    const elapsed =
      (now - monster.lastAttackTime) /
      1000;

    return (
      elapsed >=
      monster.attackCooldown
    );
  }

  // MARK ATTACK

  markAttack(monsterId) {
    const monster = this.monsters.get(
      monsterId
    );

    if (!monster || !monster.alive) {
      return false;
    }

    if (!this.canAttack(monsterId)) {
      return false;
    }

    monster.lastAttackTime =
      Date.now();

    return true;
  }

  // GET ZONE COUNT

  getZoneMonsterCount(
    zoneId,
    type
  ) {
    const zoneMap =
      this.zoneCounts.get(
        zoneId
      );

    if (!zoneMap) {
      return 0;
    }

    return (
      zoneMap.get(type) || 0
    );
  }

  // INCREMENT ZONE COUNT

  incrementZoneCount(
    zoneId,
    type
  ) {
    if (
      !this.zoneCounts.has(
        zoneId
      )
    ) {
      this.zoneCounts.set(
        zoneId,
        new Map()
      );
    }

    const zoneMap =
      this.zoneCounts.get(
        zoneId
      );

    const count =
      zoneMap.get(type) || 0;

    zoneMap.set(
      type,
      count + 1
    );
  }

  // DECREMENT ZONE COUNT

  decrementZoneCount(
    zoneId,
    type
  ) {
    const zoneMap =
      this.zoneCounts.get(
        zoneId
      );

    if (!zoneMap) {
      return;
    }

    const count =
      zoneMap.get(type) || 0;

    if (count <= 1) {
      zoneMap.delete(type);
    } else {
      zoneMap.set(
        type,
        count - 1
      );
    }

    if (zoneMap.size === 0) {
      this.zoneCounts.delete(
        zoneId
      );
    }
  }

  // BROADCAST SPAWN

  broadcastMonsterSpawn(
    monster
  ) {
    this.io
      .to(monster.zoneId)
      .emit("monster_spawned", {
        monsterId:
          monster.monsterId,

        type:
          monster.type,

        displayName:
          monster.displayName,

        hp:
          monster.hp,

        maxHp:
          monster.maxHp,

        position:
          monster.position,

        zoneId:
          monster.zoneId,
      });
  }

  // BROADCAST DAMAGE

  broadcastMonsterDamaged(
    data
  ) {
    const monster =
      this.monsters.get(
        data.monsterId
      );

    if (!monster) {
      return;
    }

    this.io
      .to(monster.zoneId)
      .emit(
        "monster_damaged",
        data
      );
  }

  // BROADCAST ALL MONSTERS IN ZONE

  sendZoneMonsters(
    socket,
    zoneId
  ) {
    const monsters =
      this.getMonstersInZone(
        zoneId
      );

    socket.emit(
      "monster_list",
      monsters.map(
        (monster) => ({
          monsterId:
            monster.monsterId,

          type:
            monster.type,

          displayName:
            monster.displayName,

          hp:
            monster.hp,

          maxHp:
            monster.maxHp,

          position:
            monster.position,

          zoneId:
            monster.zoneId,
        })
      )
    );
  }

  // GET STATS

  getStats() {
    const monsters =
      Array.from(
        this.monsters.values()
      );

    return {
      total:
        monsters.length,

      alive:
        monsters.filter(
          (m) => m.alive
        ).length,

      templates:
        this.templates.size,

      zones:
        this.zoneCounts.size,
    };
  }

  getPublicMonstersInZone(zoneId) {
  const monsters = this.getMonstersInZone(zoneId);

  return monsters.map((monster) => ({
    monsterId: monster.monsterId,
    type: monster.type,
    displayName: monster.displayName,

    hp: monster.hp,
    maxHp: monster.maxHp,

    position: {
      x: monster.position.x,
      y: monster.position.y,
    },

    zoneId: monster.zoneId,
  }));
}
}


module.exports = MonsterManager;