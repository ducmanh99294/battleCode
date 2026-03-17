function calculateDamage(attacker, defender, baseDamage) {
  const attack = attacker.attack || 10;
  const defense = defender.defense || 5;

  // 🎯 công thức đơn giản
  let damage = baseDamage + attack - defense;

  // không âm
  damage = Math.max(1, damage);

  // 🎲 crit 10%
  if (Math.random() < 0.1) {
    damage *= 2;
  }

  return Math.floor(damage);
}

function applyDamage(target, damage) {
  target.hp -= damage;

  if (target.hp < 0) target.hp = 0;
}

module.exports = {
  calculateDamage,
  applyDamage
};