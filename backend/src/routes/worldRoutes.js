const express = require("express");

const {
  getWorld,
  updateWeather,
  updateTime,
  updateEnemySpawn,
} = require("../controllers/worldController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
| Public / Authenticated
*/

// Lấy world state
router.get("/", authMiddleware, getWorld);


/*
| Admin / Server Control
|
| Tạm thời vẫn dùng authMiddleware.
|
| Sau này nên thêm adminMiddleware.
|
*/

// Weather
router.put(
  "/weather",
  authMiddleware,
  updateWeather
);

// Time
router.put(
  "/time",
  authMiddleware,
  updateTime
);

// Enemy Spawn
router.put(
  "/enemy-spawn",
  authMiddleware,
  updateEnemySpawn
);

module.exports = router;