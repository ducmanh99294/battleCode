class CombatManager {
  constructor({
    playerManager,
    monsterManager,
  }) {
    this.playerManager = playerManager;
    this.monsterManager = monsterManager;

    // Cooldown attack runtime
    this.attackCooldowns = new Map();
  }

  attackMonster({
    playerId,
    monsterId,
    attackId = "basic_attack",
  }) {
    // 1. CHECK PLAYER

    const player =
      this.playerManager.getPlayer(playerId);

    if (!player) {
      return {
        success: false,
        reason: "PLAYER_NOT_FOUND",
      };
    }

    // 2. CHECK MONSTER

    const monster =
      this.monsterManager.getMonster(monsterId);

    if (!monster) {
      return {
        success: false,
        reason: "MONSTER_NOT_FOUND",
      };
    }

    if (!monster.alive) {
      return {
        success: false,
        reason: "MONSTER_DEAD",
      };
    }

    // 3. CHECK SAME ZONE

    if (monster.zoneId !== player.zoneId) {
      return {
        success: false,
        reason: "INVALID_ZONE",
      };
    }

    // 4. CHECK DISTANCE

    const distance = this.getDistance(
      player.position,
      monster.position
    );

    if (distance > monster.attackRange + 1) {
      return {
        success: false,
        reason: "OUT_OF_RANGE",
      };
    }

    // 5. CHECK ATTACK COOLDOWN

    if (!this.canAttack(playerId, attackId)) {
      return {
        success: false,
        reason: "ATTACK_COOLDOWN",
      };
    }

    // 6. CALCULATE DAMAGE

    const damage =
      this.calculateDamage(
        player,
        attackId
      );

    if (damage <= 0) {
      return {
        success: false,
        reason: "INVALID_DAMAGE",
      };
    }

    // 7. SET COOLDOWN

    this.markAttack(
      playerId,
      attackId
    );

    // 8. DAMAGE MONSTER

    const result =
      this.monsterManager.damageMonster({
        monsterId,
        damage,
        attackerId: playerId,
      });

    if (!result.success) {
      return {
        success: false,
        reason: result.message,
      };
    }

    // 9. RETURN RESULT

    return {
      success: true,

      attackerId: playerId,

      monsterId,

      attackId,

      damage: result.damage,

      hp: result.hp,

      maxHp: result.maxHp,

      killed: result.killed,
    };
  }

  /**
   * Calculate player damage
   *
   * Đây chỉ là công thức cơ bản.
   * Sau này có thể thêm:
   *
   * STR
   * weapon
   * skill
   * critical
   * buff
   * armor penetration
   */
  calculateDamage(
    player,
    attackId
  ) {
    const str =
      Number(player.stats?.STR) || 1;

    let damage = str;

    // Basic attack
    if (attackId === "basic_attack") {
      damage = str;
    }

    // Ví dụ skill
    else if (attackId === "power_slash") {
      damage = str * 1.5;
    }

    else {
      return 0;
    }

    return Math.max(
      1,
      Math.floor(damage)
    );
  }

  /**
   * Distance giữa player và monster
   */
  getDistance(
    playerPosition,
    monsterPosition
  ) {
    if (
      !playerPosition ||
      !monsterPosition
    ) {
      return Infinity;
    }

    const dx =
      playerPosition.x -
      monsterPosition.x;

    const dy =
      playerPosition.y -
      monsterPosition.y;

    return Math.sqrt(
      dx * dx +
      dy * dy
    );
  }

  /**
   * Attack cooldown
   */
  canAttack(
    playerId,
    attackId
  ) {
    const key =
      `${playerId}:${attackId}`;

    const lastAttack =
      this.attackCooldowns.get(key);

    if (!lastAttack) {
      return true;
    }

    const now = Date.now();

    const cooldown =
      300; // 0.3 second

    return (
      now - lastAttack >= cooldown
    );
  }

  markAttack(
    playerId,
    attackId
  ) {
    const key =
      `${playerId}:${attackId}`;

    this.attackCooldowns.set(
      key,
      Date.now()
    );
  }

  removePlayer(playerId) {
    for (
      const key of this.attackCooldowns.keys()
    ) {
      if (
        key.startsWith(`${playerId}:`)
      ) {
        this.attackCooldowns.delete(key);
      }
    }
  }
}

module.exports = CombatManager;