class ZoneManager {
  constructor() {
    /*
    | Zones
    |
    | zoneId => zone
    |
    */

    this.zones = new Map();
  }

  /*
  | Create Zone
  */

  createZone({
    zoneId,
    scene,
    maxPlayers = 50,
  }) {
    if (this.zones.has(zoneId)) {
      return this.zones.get(zoneId);
    }

    const zone = {
      zoneId,

      scene,

      maxPlayers,

      players: new Set(),

      monsters: new Set(),

      createdAt: Date.now(),
    };

    this.zones.set(
      zoneId,
      zone
    );

    return zone;
  }

  /*
  | Delete Zone
  */

  deleteZone(zoneId) {
    const zone =
      this.zones.get(zoneId);

    if (!zone) {
      return false;
    }

    /*
    | Không nên xóa zone nếu vẫn còn player
    */

    if (zone.players.size > 0) {
      return false;
    }

    this.zones.delete(zoneId);

    return true;
  }

  /*
  | Get Zone
  */

  getZone(zoneId) {
    return this.zones.get(zoneId) || null;
  }

  /*
  | Add Player To Zone
  */

  addPlayerToZone(
    playerId,
    zoneId
  ) {
    const zone =
      this.getZone(zoneId);

    if (!zone) {
      return {
        success: false,
        reason: "ZONE_NOT_FOUND",
      };
    }

    /*
    | Check Capacity
    */

    if (
      zone.players.size >=
      zone.maxPlayers
    ) {
      return {
        success: false,
        reason: "ZONE_FULL",
      };
    }

    zone.players.add(
      playerId.toString()
    );

    return {
      success: true,
      zone,
    };
  }

  /*
  | Remove Player
  */

  removePlayerFromZone(
    playerId,
    zoneId
  ) {
    const zone =
      this.getZone(zoneId);

    if (!zone) {
      return false;
    }

    return zone.players.delete(
      playerId.toString()
    );
  }

  /*
  | Move Player Between Zones
  */

  movePlayer(
    playerId,
    oldZoneId,
    newZoneId
  ) {
    const result =
      this.addPlayerToZone(
        playerId,
        newZoneId
      );

    if (!result.success) {
      return result;
    }

    /*
    | Remove From Old Zone
    */

    if (oldZoneId) {
      this.removePlayerFromZone(
        playerId,
        oldZoneId
      );
    }

    return {
      success: true,

      oldZoneId,

      newZoneId,
    };
  }

  /*
  | Add Monster
  */

  addMonsterToZone(
    monsterId,
    zoneId
  ) {
    const zone =
      this.getZone(zoneId);

    if (!zone) {
      return false;
    }

    zone.monsters.add(
      monsterId.toString()
    );

    return true;
  }

  /*
  | Remove Monster
  */

  removeMonsterFromZone(
    monsterId,
    zoneId
  ) {
    const zone =
      this.getZone(zoneId);

    if (!zone) {
      return false;
    }

    return zone.monsters.delete(
      monsterId.toString()
    );
  }

  /*
  | Get Player IDs
  */

  getPlayerIds(zoneId) {
    const zone =
      this.getZone(zoneId);

    if (!zone) {
      return [];
    }

    return Array.from(
      zone.players
    );
  }

  /*
  | Get Monster IDs
  */

  getMonsterIds(zoneId) {
    const zone =
      this.getZone(zoneId);

    if (!zone) {
      return [];
    }

    return Array.from(
      zone.monsters
    );
  }

  /*
  | Get Zone Population
  */

  getPopulation(zoneId) {
    const zone =
      this.getZone(zoneId);

    if (!zone) {
      return 0;
    }

    return zone.players.size;
  }

  /*
  | Get All Zones
  */

  getAllZones() {
    return Array.from(
      this.zones.values()
    );
  }

  /*
  | Find Available Zone
  |
  | Khi player vào Forest:
  |
  | Forest_1 full
  | Forest_2 còn chỗ
  |
  | → đưa player vào Forest_2
  |
  */

  findAvailableZone(scene) {
    for (const zone of this.zones.values()) {
      if (
        zone.scene === scene &&
        zone.players.size <
          zone.maxPlayers
      ) {
        return zone;
      }
    }

    return null;
  }

  /*
  | Get Or Create Zone
  */

  getOrCreateZone({
    scene,
    maxPlayers = 50,
  }) {
    /*
    | Try existing zone
    */

    const availableZone =
      this.findAvailableZone(scene);

    if (availableZone) {
      return availableZone;
    }

    /*
    | Create new zone
    */

    let index = 1;

    while (
      this.zones.has(
        `${scene}_${index}`
      )
    ) {
      index++;
    }

    return this.createZone({
      zoneId: `${scene}_${index}`,

      scene,

      maxPlayers,
    });
  }
}

module.exports = ZoneManager;