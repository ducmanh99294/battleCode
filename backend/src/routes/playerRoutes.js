// `routes/playerRoutes.js`

const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  getPlayer,
  savePlayer,
  updatePosition,
  upgradeStat,
  useItem,
  equipItem,
  unequipItem,
  learnSkill,
  acceptQuest,
  completeQuest,
} = require("../controllers/playerController");

const router = express.Router();

/*
| Authentication | Tất cả Player API đều yêu cầu JWT.
*/

router.use(authMiddleware);


/*
| Player
*/

// Load player
// GET /player
router.get("/", getPlayer);

// Save dữ liệu được phép
// PUT /player/save
router.put("/save", savePlayer);

// Update position
// PUT /player/position
router.put("/position", updatePosition);


/*
| Stats
*/

// Upgrade một stat
// POST /player/stats/upgrade
router.post("/stats/upgrade", upgradeStat);


//----------------------------| Inventory

// Sử dụng item
// POST /player/inventory/use
router.post("/inventory/use", useItem);

// Equip item
// POST /player/inventory/equip
router.post("/inventory/equip", equipItem);

// Unequip item
// POST /player/inventory/unequip
router.post("/inventory/unequip", unequipItem);


//---------------------------- Skills

// Học skill
// POST /player/skills/learn
router.post("/skills/learn", learnSkill);


//----------------------------| Quests

// Nhận quest
// POST /player/quests/accept
router.post("/quests/accept", acceptQuest);

// Hoàn thành quest
// POST /player/quests/complete
router.post("/quests/complete", completeQuest);


module.exports = router;
