function validateAction(action, dungeon, userId) {
  if (!action || typeof action !== "object") {
    throw new Error("Invalid action");
  }

  // 🎯 chỉ cho phép các type hợp lệ
  const allowedTypes = ["attack", "heal", "defend"];

  if (!allowedTypes.includes(action.type)) {
    throw new Error("Invalid action type");
  }

  // ⚔️ ATTACK
  if (action.type === "attack") {
    const enemy = dungeon.enemies.find(e => e.id === action.target);

    if (!enemy) {
      throw new Error("Invalid target");
    }

    return {
      type: "attack",
      target: enemy.id,
      damage: Math.min(action.damage || 10, 50) // limit damage
    };
  }

  // ❤️ HEAL
  if (action.type === "heal") {
    return {
      type: "heal",
      amount: Math.min(action.amount || 5, 20)
    };
  }

  // 🛡 DEFEND
  if (action.type === "defend") {
    return { type: "defend" };
  }

  throw new Error("Unknown action");
}

module.exports = { validateAction };