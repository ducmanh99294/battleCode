const express = require("express");

const {
  getMonsters,
  getMonsterByType,
  createMonster,
  updateMonster,
  deleteMonster,
} = require("../controllers/monsterController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// PLAYER / AUTHENTICATED USER

// Xem danh sách monster
router.get("/", authMiddleware, getMonsters);

// Xem thông tin một monster
router.get("/:type", authMiddleware, getMonsterByType);


// ADMIN ONLY

// Tạo monster
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createMonster
);

// Cập nhật monster
router.put(
  "/:type",
  authMiddleware,
  adminMiddleware,
  updateMonster
);

// Xóa monster
router.delete(
  "/:type",
  authMiddleware,
  adminMiddleware,
  deleteMonster
);

module.exports = router;