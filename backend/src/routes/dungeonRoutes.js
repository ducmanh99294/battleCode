// routes/dungeonRoutes.js

const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const { enterDungeon } = require("../controllers/dungeonController");

const router = express.Router();

/*
| Tất cả Dungeon API đều yêu cầu JWT.
*/

router.use(authMiddleware);

/*
| Vào dungeon: client gửi tier + điểm spawn đã gen,
| server validate rồi spawn quái, trả về danh sách.
|
| POST /api/dungeon/enter
*/

router.post("/enter", enterDungeon);

module.exports = router;
