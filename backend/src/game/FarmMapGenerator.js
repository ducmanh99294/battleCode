// FarmMapGenerator.js — Server: sinh map farm theo seed (quyết định vị trí tài nguyên)
// Đặt vào: backend/src/game/FarmMapGenerator.js

// PRNG có seed (để tái tạo được nếu cần)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class FarmMapGenerator {
  constructor(width = 128, height = 128) {
    this.width = width;
    this.height = height;
    console.log(`[FarmMap] Khởi tạo generator ${width}x${height}`);
  }

  /**
   * Sinh map cho 1 player. Trả về object gửi cho client.
   * @param {number} seed - seed ngẫu nhiên (server tự tạo mỗi trận)
   */
  generate(seed) {
    const rand = mulberry32(seed);
    const occupied = new Set();
    const key = (x, y) => `${x},${y}`;

    // Kiểm tra ô trống (cách các vật khác margin ô)
    const isFree = (x, y, margin = 2) => {
      for (let dx = -margin; dx <= margin; dx++)
        for (let dy = -margin; dy <= margin; dy++)
          if (occupied.has(key(x + dx, y + dy))) return false;
      return true;
    };
    const mark = (x, y, r = 1) => {
      for (let dx = -r; dx <= r; dx++)
        for (let dy = -r; dy <= r; dy++)
          occupied.add(key(x + dx, y + dy));
    };
    const randPos = (margin) => ({
      x: margin + Math.floor(rand() * (this.width - margin * 2)),
      y: margin + Math.floor(rand() * (this.height - margin * 2)),
    });

    // Điểm spawn ở giữa map, giữ khoảng trống
    const spawn = { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
    mark(spawn.x, spawn.y, 6);

    // Ao nước (2-3 cái, chặn di chuyển, trang trí)
    const ponds = [];
    const pondCount = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < pondCount; i++) {
      for (let attempt = 0; attempt < 60; attempt++) {
        const p = randPos(12);
        if (isFree(p.x, p.y, 5)) {
          const r = 2 + Math.floor(rand() * 3); // bán kính 2-4
          ponds.push({ x: p.x, y: p.y, r });
          mark(p.x, p.y, r + 2);
          break;
        }
      }
    }

    // Cây (45-60 cây, mỗi cây 3-5 gỗ)
    const trees = [];
    const treeCount = 45 + Math.floor(rand() * 16);
    for (let i = 0; i < treeCount; i++) {
      for (let attempt = 0; attempt < 40; attempt++) {
        const p = randPos(4);
        if (isFree(p.x, p.y, 1)) {
          trees.push({ x: p.x, y: p.y, wood: 3 + Math.floor(rand() * 3) });
          mark(p.x, p.y, 1);
          break;
        }
      }
    }

    // Cỏ trang trí (150-200 bụi, chỉ visual)
    const grass = [];
    const grassCount = 150 + Math.floor(rand() * 51);
    for (let i = 0; i < grassCount; i++) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const p = randPos(2);
        if (isFree(p.x, p.y, 0)) {
          grass.push({ x: p.x, y: p.y, v: Math.floor(rand() * 3) }); // v: biến thể 0-2
          mark(p.x, p.y, 0);
          break;
        }
      }
    }

    // Đá (25-35 cục, mỗi cục 2-4 đá)
    const rocks = [];
    const rockCount = 25 + Math.floor(rand() * 11);
    for (let i = 0; i < rockCount; i++) {
      for (let attempt = 0; attempt < 40; attempt++) {
        const p = randPos(4);
        if (isFree(p.x, p.y, 1)) {
          rocks.push({ x: p.x, y: p.y, stone: 2 + Math.floor(rand() * 3) });
          mark(p.x, p.y, 1);
          break;
        }
      }
    }

    // Cổng vào dungeon (1 cái, đặt gần mép map, chỗ trống)
    let dungeonPortal = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      const p = randPos(8);
      // Ưu tiên gần mép (tạo cảm giác "đi ra ngoài")
      const nearEdge = p.x < 15 || p.x > this.width - 15 || p.y < 15 || p.y > this.height - 15;
      if (isFree(p.x, p.y, 3) && (nearEdge || attempt > 50)) {
        dungeonPortal = { x: p.x, y: p.y };
        mark(p.x, p.y, 2);
        break;
      }
    }

    console.log(`[FarmMap] Seed ${seed}: ${trees.length} cây, ${rocks.length} đá, ${ponds.length} ao, ${grass.length} cỏ`);
    return {
      seed,
      width: this.width,
      height: this.height,
      spawn,
      trees,
      rocks,
      ponds,
      grass,
      dungeonPortal,
    };
  }
}

module.exports = FarmMapGenerator;
