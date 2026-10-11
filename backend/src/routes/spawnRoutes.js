const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getSpawnPoints, createSpawnPoint, updateSpawnPoint, deleteSpawnPoint,
} = require("../controllers/spawnController");

const router = express.Router();

router.get("/", authMiddleware, getSpawnPoints);
router.post("/", authMiddleware, adminMiddleware, createSpawnPoint);
router.put("/:id", authMiddleware, adminMiddleware, updateSpawnPoint);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSpawnPoint);

module.exports = router;