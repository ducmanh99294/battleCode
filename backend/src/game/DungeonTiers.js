// DungeonTiers.js — cấu hình các tầng dungeon. SERVER là nguồn duy nhất.
// Client chỉ gửi tier + điểm spawn; LOẠI QUÁI do server chọn theo pool này.
// "type" phải khớp với field `type` trong collection Monster (MongoDB).
// Type nào không có trong DB sẽ bị bỏ qua (có warning).

const DUNGEON_TIERS = {
  1: {
    name: "Hầm Ngục Tầng 1",
    maxMonsters: 12,   // số điểm spawn tối đa client được gửi
    bounds: 128,       // |x|,|y| tối đa (nới từ 64 để hỗ trợ map lớn hơn)
    minSpacing: 2,     // khoảng cách tối thiểu giữa các điểm spawn
    pool: [
      { type: "slime", weight: 70 },
      { type: "goblin", weight: 30 },
    ],
  },
  2: {
    name: "Hầm Ngục Tầng 2",
    maxMonsters: 16,
    bounds: 128,       // |x|,|y| tối đa (nới từ 64 để hỗ trợ map lớn hơn)
    minSpacing: 2,
    pool: [
      { type: "slime", weight: 40 },
      { type: "goblin", weight: 40 },
      { type: "wolf", weight: 20 },
    ],
  },
  3: {
    name: "Hầm Ngục Tầng 3",
    maxMonsters: 20,
    bounds: 128,       // |x|,|y| tối đa (nới từ 64 để hỗ trợ map lớn hơn)
    minSpacing: 2,
    pool: [
      { type: "goblin", weight: 40 },
      { type: "wolf", weight: 40 },
      { type: "skeleton", weight: 20 },
    ],
  },
};

function getTier(tier) {
  return DUNGEON_TIERS[tier] || null;
}

// Chọn ngẫu nhiên n type theo weight. Trả về mảng type (có thể trùng).
function pickTypes(tierConfig, n, randomFn = Math.random) {
  const pool = tierConfig.pool;
  const total = pool.reduce((s, p) => s + p.weight, 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    let r = randomFn() * total;
    let picked = pool[pool.length - 1].type;
    for (const p of pool) {
      r -= p.weight;
      if (r < 0) { picked = p.type; break; }
    }
    out.push(picked);
  }
  return out;
}

module.exports = { DUNGEON_TIERS, getTier, pickTypes };
