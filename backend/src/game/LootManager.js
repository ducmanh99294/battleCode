const crypto = require("crypto");

class LootManager {
  constructor({
    io,
    playerManager,
  }) {
    this.io = io;
    this.playerManager = playerManager;

    // Runtime Loot
    // lootId => loot

    this.loots = new Map();

    // Cleanup interval
    this.cleanupInterval = null;
  }

  // Spawn Loot

  spawnLoot({
    itemId,
    amount = 1,
    zoneId,
    x = 0,
    y = 0,
    ownerId = null,
  }) {
    if (!itemId) {
      return null;
    }

    if (!zoneId) {
      return null;
    }

    const lootId = crypto.randomUUID();

    const now = Date.now();

    const loot = {
      lootId,

      itemId,

      amount: Math.max(
        1,
        Math.floor(Number(amount) || 1)
      ),

      zoneId,

      position: {
        x: Number(x) || 0,
        y: Number(y) || 0,
      },

      // Player được quyền nhặt
      // null = ai cũng có thể nhặt
      ownerId,

      picked: false,

      createdAt: now,

      // Loot tồn tại 60 giây
      expireAt: now + 60 * 1000,
    };

    this.loots.set(
      lootId,
      loot
    );

    // Broadcast

    this.io
      .to(zoneId)
      .emit(
        "loot_spawned",
        {
          lootId: loot.lootId,

          itemId: loot.itemId,

          amount: loot.amount,

          position: {
            x: loot.position.x,
            y: loot.position.y,
          },

          zoneId: loot.zoneId,
        }
      );

    return loot;
  }

  // Spawn Drops

  spawnDrops({
    drops,
    zoneId,
    x,
    y,
    ownerId = null,
  }) {
    if (!Array.isArray(drops)) {
      return [];
    }

    const result = [];

    for (const drop of drops) {
      if (!drop) {
        continue;
      }

      const loot = this.spawnLoot({
        itemId: drop.itemId,

        amount:
          drop.amount ?? 1,

        zoneId,

        x,
        y,

        ownerId,
      });

      if (loot) {
        result.push(loot);
      }
    }

    return result;
  }

  // Get Loot

  getLoot(lootId) {
    if (!lootId) {
      return null;
    }

    return (
      this.loots.get(
        lootId.toString()
      ) || null
    );
  }

  // Get Loot In Zone

  getLootInZone(zoneId) {
    const result = [];

    for (const loot of this.loots.values()) {
      if (
        loot.zoneId === zoneId &&
        !loot.picked
      ) {
        result.push(loot);
      }
    }

    return result;
  }

  // Pickup Loot

  pickupLoot(
    playerId,
    lootId
  ) {
    const player =
      this.playerManager.getPlayer(
        playerId
      );

    if (!player) {
      return {
        success: false,
        reason: "PLAYER_NOT_FOUND",
      };
    }

    const loot =
      this.getLoot(lootId);

    if (!loot) {
      return {
        success: false,
        reason: "LOOT_NOT_FOUND",
      };
    }

    // Already picked

    if (loot.picked) {
      return {
        success: false,
        reason: "LOOT_ALREADY_PICKED",
      };
    }

    // Expired

    if (
      Date.now() >= loot.expireAt
    ) {
      this.removeLoot(loot.lootId);

      this.io
        .to(loot.zoneId)
        .emit(
          "loot_removed",
          {
            lootId: loot.lootId,
            reason: "expired",
          }
        );

      return {
        success: false,
        reason: "LOOT_EXPIRED",
      };
    }

    // Zone check

    if (
      player.zoneId !==
      loot.zoneId
    ) {
      return {
        success: false,
        reason: "INVALID_ZONE",
      };
    }

    // Distance check

    const distance =
      this.getDistance(
        player.position,
        loot.position
      );

    const pickupRange = 2;

    if (
      distance > pickupRange
    ) {
      return {
        success: false,
        reason: "TOO_FAR",
      };
    }

    // Owner check

    if (
      loot.ownerId &&
      loot.ownerId.toString() !==
        playerId.toString()
    ) {
      return {
        success: false,
        reason: "NOT_YOUR_LOOT",
      };
    }

    // Add inventory

    const added =
      this.playerManager.addItem(
        playerId,
        loot.itemId,
        loot.amount
      );

    if (!added) {
      return {
        success: false,
        reason: "INVENTORY_FULL",
      };
    }

    // Mark picked

    loot.picked = true;

    // Remove runtime loot

    this.removeLoot(
      loot.lootId
    );

    // Notify players in zone

    this.io
      .to(loot.zoneId)
      .emit(
        "loot_removed",
        {
          lootId: loot.lootId,

          pickedBy:
            playerId.toString(),
        }
      );

    return {
      success: true,

      lootId: loot.lootId,

      itemId: loot.itemId,

      amount: loot.amount,
    };
  }

  // Remove Loot

  removeLoot(lootId) {
    if (!lootId) {
      return false;
    }

    return this.loots.delete(
      lootId.toString()
    );
  }

  // Distance

  getDistance(
    playerPosition,
    lootPosition
  ) {
    if (
      !playerPosition ||
      !lootPosition
    ) {
      return Infinity;
    }

    const dx =
      playerPosition.x -
      lootPosition.x;

    const dy =
      playerPosition.y -
      lootPosition.y;

    return Math.sqrt(
      dx * dx +
      dy * dy
    );
  }

  // Cleanup Expired Loot

  cleanupExpiredLoot() {
    const now = Date.now();

    for (
      const loot of this.loots.values()
    ) {
      if (
        now >= loot.expireAt
      ) {
        this.io
          .to(loot.zoneId)
          .emit(
            "loot_removed",
            {
              lootId:
                loot.lootId,

              reason:
                "expired",
            }
          );

        this.loots.delete(
          loot.lootId
        );
      }
    }
  }

  // Start Cleanup

  startCleanup() {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval =
      setInterval(() => {
        this.cleanupExpiredLoot();
      }, 10000);
  }

  // Stop Cleanup

  stopCleanup() {
    if (
      this.cleanupInterval
    ) {
      clearInterval(
        this.cleanupInterval
      );

      this.cleanupInterval = null;
    }
  }
}

module.exports = LootManager;