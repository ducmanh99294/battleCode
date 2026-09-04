const Player = require("../models/Player");

class PlayerManager {
  constructor() {
    // Online Players
    // playerId => runtime player

    this.players = new Map();
  }

  // Add Player

  addPlayer(playerData) {
    const playerId = playerData.playerId.toString();

    // Nếu player đã online
    const existingPlayer = this.players.get(playerId);

    if (existingPlayer) {
      existingPlayer.socketId = playerData.socketId;
      existingPlayer.isOnline = true;
      existingPlayer.lastUpdate = Date.now();

      return existingPlayer;
    }

    // Runtime Player

    const dbPlayer = playerData.dbPlayer || {};

    const player = {
      // Identity
      playerId,
      socketId: playerData.socketId,
      username: playerData.username || null,

      // World

      scene:
        dbPlayer.position?.scene ||
        playerData.scene ||
        "Village",

      zoneId:
        playerData.zoneId || null,

      position: {
        x:
          dbPlayer.position?.x ??
          playerData.x ??
          0,

        y:
          dbPlayer.position?.y ??
          playerData.y ??
          0,
      },

      // Character

      level: dbPlayer.level ?? 1,

      exp: dbPlayer.exp ?? 0,

      maxExp:
        dbPlayer.maxExp ??
        this.calculateMaxExp(dbPlayer.level ?? 1),

      gold: dbPlayer.gold ?? 0,

      // Stats

      stats: {
        STR: dbPlayer.stats?.STR ?? 1,
        VIT: dbPlayer.stats?.VIT ?? 1,
        AGI: dbPlayer.stats?.AGI ?? 1,
        INT: dbPlayer.stats?.INT ?? 1,
        END: dbPlayer.stats?.END ?? 1,
        LUK: dbPlayer.stats?.LUK ?? 1,
      },

      // Resources

      health: {
        current:
          dbPlayer.health?.current ??
          dbPlayer.health?.max ??
          100,

        max:
          dbPlayer.health?.max ??
          100,
      },

      mana: {
        current:
          dbPlayer.mana?.current ??
          dbPlayer.mana?.max ??
          100,

        max:
          dbPlayer.mana?.max ??
          100,
      },

      energy: {
        current:
          dbPlayer.energy?.current ??
          dbPlayer.energy?.max ??
          100,

        max:
          dbPlayer.energy?.max ??
          100,
      },

      // Inventory

      inventory: Array.isArray(dbPlayer.inventory)
        ? dbPlayer.inventory.map((item) => ({
            itemId: item.itemId,
            amount: item.amount,
          }))
        : [],

      // Skills

      learnedSkills: Array.isArray(dbPlayer.learnedSkills)
        ? dbPlayer.learnedSkills.map((skill) => ({
            skillId: skill.skillId,
            level: skill.level,
          }))
        : [],

      // Equipment

      equippedItems: {
        weapon:
          dbPlayer.equippedItems?.weapon ?? null,

        armor:
          dbPlayer.equippedItems?.armor ?? null,

        helmet:
          dbPlayer.equippedItems?.helmet ?? null,

        ring:
          dbPlayer.equippedItems?.ring ?? null,
      },

      // Quests

      quests: Array.isArray(dbPlayer.quests)
        ? dbPlayer.quests
        : [],

      // Character Points

      attributePoints:
        dbPlayer.attributePoints ?? 0,

      // Runtime Status

      isOnline: true,

      lastUpdate: Date.now(),

      lastMoveTime: 0,
    };

    this.players.set(playerId, player);

    return player;
  }

  // Remove Player

  removePlayer(playerId) {
    playerId = playerId.toString();

    const player = this.players.get(playerId);

    if (!player) {
      return null;
    }

    this.players.delete(playerId);

    return player;
  }

  // Get Player

  getPlayer(playerId) {
    if (!playerId) {
      return null;
    }

    return (
      this.players.get(playerId.toString()) ||
      null
    );
  }

  // Get Player By Socket

  getPlayerBySocket(socketId) {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) {
        return player;
      }
    }

    return null;
  }

  // Update Position

  updatePosition(playerId, x, y) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    player.position.x = Number(x);
    player.position.y = Number(y);

    player.lastMoveTime = Date.now();
    player.lastUpdate = Date.now();

    return player;
  }

  // Update Scene

  updateScene(playerId, scene, zoneId) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    player.scene = scene;
    player.zoneId = zoneId;

    player.lastUpdate = Date.now();

    return player;
  }

  // Update Socket

  updateSocket(playerId, socketId) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    player.socketId = socketId;
    player.isOnline = true;
    player.lastUpdate = Date.now();

    return player;
  }

  // Get All Players

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  // Get Online Player Count

  getPlayerCount() {
    return this.players.size;
  }

  // Get Players In Zone

  getPlayersInZone(zoneId) {
    const players = [];

    for (const player of this.players.values()) {
      if (
        player.zoneId === zoneId &&
        player.isOnline
      ) {
        players.push(player);
      }
    }

    return players;
  }

  // Get Public Player Data

  getPublicPlayerData(playerId) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    return {
      playerId: player.playerId,

      username: player.username,

      scene: player.scene,

      zoneId: player.zoneId,

      x: player.position.x,

      y: player.position.y,

      level: player.level,
    };
  }

  // Get Public Players In Zone

  getPublicPlayersInZone(zoneId) {
    return this.getPlayersInZone(zoneId)
      .map((player) => ({
        playerId: player.playerId,

        username: player.username,

        x: player.position.x,

        y: player.position.y,

        scene: player.scene,

        level: player.level,
      }));
  }

  // EXP

  calculateMaxExp(level) {
    return Math.floor(
      100 * Math.pow(level, 1.5)
    );
  }

  addExp(playerId, amount) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    amount = Math.max(
      0,
      Math.floor(Number(amount) || 0)
    );

    player.exp += amount;

    let levelUp = false;

    while (
      player.exp >= player.maxExp
    ) {
      player.exp -= player.maxExp;

      player.level += 1;

      player.maxExp =
        this.calculateMaxExp(player.level);

      player.attributePoints += 5;

      levelUp = true;
    }

    player.lastUpdate = Date.now();

    return {
      player,
      gainedExp: amount,
      levelUp,
      level: player.level,
      exp: player.exp,
      maxExp: player.maxExp,
    };
  }

  // Gold

  addGold(playerId, amount) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return false;
    }

    amount = Math.max(
      0,
      Math.floor(Number(amount) || 0)
    );

    player.gold += amount;

    return true;
  }

  removeGold(playerId, amount) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return false;
    }

    amount = Math.max(
      0,
      Math.floor(Number(amount) || 0)
    );

    if (player.gold < amount) {
      return false;
    }

    player.gold -= amount;

    return true;
  }

  // Inventory

  addItem(playerId, itemId, amount = 1) {
    const player = this.getPlayer(playerId);

    if (!player || !itemId) {
      return false;
    }

    amount = Math.max(
      1,
      Math.floor(Number(amount) || 1)
    );

    const existing =
      player.inventory.find(
        (item) => item.itemId === itemId
      );

    if (existing) {
      existing.amount += amount;
    } else {
      player.inventory.push({
        itemId,
        amount,
      });
    }

    player.lastUpdate = Date.now();

    return true;
  }

  removeItem(playerId, itemId, amount = 1) {
    const player = this.getPlayer(playerId);

    if (!player || !itemId) {
      return false;
    }

    amount = Math.max(
      1,
      Math.floor(Number(amount) || 1)
    );

    const index =
      player.inventory.findIndex(
        (item) => item.itemId === itemId
      );

    if (index === -1) {
      return false;
    }

    const item = player.inventory[index];

    if (item.amount < amount) {
      return false;
    }

    item.amount -= amount;

    if (item.amount <= 0) {
      player.inventory.splice(index, 1);
    }

    player.lastUpdate = Date.now();

    return true;
  }

  hasItem(playerId, itemId, amount = 1) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return false;
    }

    const item =
      player.inventory.find(
        (item) => item.itemId === itemId
      );

    return !!item &&
      item.amount >= amount;
  }

  // Health

  setHealth(playerId, current, max = null) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    if (max !== null) {
      player.health.max = Math.max(
        1,
        Math.floor(max)
      );
    }

    player.health.current = Math.max(
      0,
      Math.min(
        Math.floor(current),
        player.health.max
      )
    );

    player.lastUpdate = Date.now();

    return player.health;
  }

  // Mana

  setMana(playerId, current, max = null) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    if (max !== null) {
      player.mana.max = Math.max(
        1,
        Math.floor(max)
      );
    }

    player.mana.current = Math.max(
      0,
      Math.min(
        Math.floor(current),
        player.mana.max
      )
    );

    player.lastUpdate = Date.now();

    return player.mana;
  }

  // Energy

  setEnergy(playerId, current, max = null) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    if (max !== null) {
      player.energy.max = Math.max(
        0,
        Math.floor(max)
      );
    }

    player.energy.current = Math.max(
      0,
      Math.min(
        Math.floor(current),
        player.energy.max
      )
    );

    player.lastUpdate = Date.now();

    return player.energy;
  }

  // Save Data
  // Chỉ lấy dữ liệu cần lưu MongoDB

  getSaveData(playerId) {
    const player = this.getPlayer(playerId);

    if (!player) {
      return null;
    }

    return {
      level: player.level,

      exp: player.exp,

      maxExp: player.maxExp,

      gold: player.gold,

      stats: {
        STR: player.stats.STR,
        VIT: player.stats.VIT,
        AGI: player.stats.AGI,
        INT: player.stats.INT,
        END: player.stats.END,
        LUK: player.stats.LUK,
      },

      health: {
        current: player.health.current,
        max: player.health.max,
      },

      mana: {
        current: player.mana.current,
        max: player.mana.max,
      },

      energy: {
        current: player.energy.current,
        max: player.energy.max,
      },

      position: {
        x: player.position.x,
        y: player.position.y,
        scene: player.scene,
      },

      inventory: player.inventory,

      learnedSkills: player.learnedSkills,

      equippedItems: player.equippedItems,

      quests: player.quests,

      attributePoints: player.attributePoints,
    };
  }

  async savePlayer(playerId) {
  const player = this.getPlayer(playerId);

  if (!player) {
    return {
      success: false,
      reason: "PLAYER_NOT_FOUND",
    };
  }

  const saveData = this.getSaveData(playerId);

  if (!saveData) {
    return {
      success: false,
      reason: "PLAYER_NOT_FOUND",
    };
  }

  try {
    await Player.findOneAndUpdate(
      { userId: playerId },
      {
        $set: saveData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    player.lastUpdate = Date.now();

    console.log(
      `[PlayerManager] Player ${playerId} saved`
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[PlayerManager] savePlayer error:",
      error
    );

    return {
      success: false,
      reason: "SAVE_FAILED",
    };
  }
}
}

module.exports = PlayerManager;