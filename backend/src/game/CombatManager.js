const ATTACKS = {
  basic_attack: { multiplier: 1,   stat: "STR", cooldown: 300, range: null },
  power_slash:  { multiplier: 1.5, stat: "STR", cooldown: 300, range: null },
  bow_shot:     { multiplier: 1.2, stat: "AGI", cooldown: 400, range: 12 }, // chỉnh theo ý bạn
};

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
    
    const attack = ATTACKS[attackId];
    if (!attack) return { success: false, reason: "INVALID_ATTACK" };

    if (!this.canAttack(playerId, attackId, attack.cooldown))
      return { success: false, reason: "ATTACK_COOLDOWN" };

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

    // Server tự check khoảng cách: vũ khí tầm xa (bow) dùng range riêng,
    // cận chiến dùng attackRange của quái + 1. Client không thể đánh xa.
    const maxRange = attack.range ?? monster.attackRange + 1;

    if (distance > maxRange) {
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
   * Calculate player damage — SERVER-AUTHORITATIVE.
   *
   * Client chỉ gửi attackId. Mọi chỉ số (base stats từ DB + đồ đang mặc
   * + thiên phú) đều do server tự cộng. Client không thể tự buff damage.
   */
  calculateDamage(player, attackId) {
    const attack = ATTACKS[attackId];
    if (!attack) return 0;

    const eff = this.getEffectiveStats(player);
    const statValue = Number(eff[attack.stat]) || 1;
    const flatAttack = Number(eff.attack) || 0;

    return Math.max(1, Math.floor(statValue * attack.multiplier) + flatAttack);
  }

  /**
   * Chỉ số hiệu dụng = base (DB) + equipment (DB, server tự resolve)
   * + talent (DB, server tự roll). Không có gì lấy từ client.
   */
  getEffectiveStats(player) {
    const { getTalent } = require("./Talents");
    const base = player.stats || {};
    const eq = player.equipmentStats || {};
    const talentBonus = getTalent(player.talentId)?.bonus || {};

    const out = {};
    for (const k of [
      "STR", "VIT", "AGI", "INT", "END", "LUK",
      "attack", "defense", "maxHealth", "maxMana",
    ]) {
      out[k] =
        (Number(base[k]) || 0) +
        (Number(eq[k]) || 0) +
        (Number(talentBonus[k]) || 0);
    }
    return out;
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
  canAttack(playerId, attackId, cooldown = 300) {
    const last = this.attackCooldowns.get(`${playerId}:${attackId}`);
    return !last || Date.now() - last >= cooldown;
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