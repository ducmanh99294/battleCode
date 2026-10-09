// Talents.js — định nghĩa thiên phú duy nhất trên SERVER.
// Client không bao giờ tự roll hay tự cộng chỉ số: roll qua API,
// server lưu talentId vào DB và tự cộng bonus khi tính toán.

const TALENTS = {
  power: {
    id: "power",
    name: "Sức mạnh vô song",
    desc: "+10 ATK",
    bonus: { attack: 10 },
    weight: 30,
  },
  swift: {
    id: "swift",
    name: "Thân thủ nhanh nhẹn",
    desc: "+5 AGI",
    bonus: { AGI: 5 },
    weight: 30,
  },
  iron: {
    id: "iron",
    name: "Mình đồng da sắt",
    desc: "+20 HP",
    bonus: { maxHealth: 20 },
    weight: 30,
  },
  chosen: {
    id: "chosen",
    name: "Kẻ được chọn",
    desc: "x2 EXP",
    bonus: { expMul: 2 },
    weight: 10,
  },
};

function rollTalentId(randomFn = Math.random) {
  const entries = Object.values(TALENTS);
  const total = entries.reduce((s, t) => s + t.weight, 0);
  let r = randomFn() * total;
  for (const t of entries) {
    r -= t.weight;
    if (r < 0) return t.id;
  }
  return entries[entries.length - 1].id;
}

function getTalent(id) {
  return TALENTS[id] || null;
}

module.exports = { TALENTS, rollTalentId, getTalent };
