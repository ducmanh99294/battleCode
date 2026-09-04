// controllers/playerController.js`

const mongoose = require("mongoose");
const Player = require("../models/Player");
const Item = require("../models/Item");
const Skill = require("../models/Skill");
const Quest = require("../models/Quest");

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

// Lấy Player dựa trên userId từ JWT
const getPlayerByUserId = async (userId) => {
  return Player.findOne({ userId });
};

// Kiểm tra ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


/*
|--------------------------------------------------------------------------
| GET PLAYER
|--------------------------------------------------------------------------
| GET /player
|
| Load toàn bộ dữ liệu player của user đang đăng nhập.
|--------------------------------------------------------------------------
*/

const getPlayer = async (req, res) => {
  try {
    const userId = req.user.userId;

    const player = await Player.findOne({ userId })
      .populate("learnedSkills.skillId")
      .populate("inventory.itemId")
      .populate("equippedItems.weapon")
      .populate("equippedItems.armor")
      .populate("equippedItems.helmet")
      .populate("equippedItems.ring")
      .populate("quests.questId");

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    return res.status(200).json({
      success: true,
      player,
    });
  } catch (error) {
    console.error("getPlayer error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
| PUT /player/save
|
| Chỉ lưu dữ liệu client được phép gửi:
| - position
| - playtime
|
| Không cho client tự save:
| - gold
| - exp
| - level
| - stats
| - inventory
| - skills
| - quests
|--------------------------------------------------------------------------
*/

const savePlayer = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { position, playtime } = req.body;

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Position
    |--------------------------------------------------------------------------
    */

    if (position !== undefined) {
      if (
        typeof position.x !== "number" ||
        typeof position.y !== "number" ||
        typeof position.scene !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid position",
        });
      }

      player.position.x = position.x;
      player.position.y = position.y;
      player.position.scene = position.scene;
    }

    /*
    |--------------------------------------------------------------------------
    | Playtime
    |--------------------------------------------------------------------------
    */

    if (playtime !== undefined) {
      if (
        typeof playtime !== "number" ||
        playtime < player.playtime
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid playtime",
        });
      }

      player.playtime = playtime;
    }

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Player saved successfully",
      player,
    });
  } catch (error) {
    console.error("savePlayer error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE POSITION
|--------------------------------------------------------------------------
| PUT /player/position
|
| Client gửi:
|
| {
|   "x": 10,
|   "y": 20,
|   "scene": "Forest"
| }
|
|--------------------------------------------------------------------------
*/

const updatePosition = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { x, y, scene } = req.body;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof scene !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid position data",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    player.position.x = x;
    player.position.y = y;
    player.position.scene = scene;

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Position updated",
      position: player.position,
    });
  } catch (error) {
    console.error("updatePosition error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPGRADE STAT
|--------------------------------------------------------------------------
| POST /player/stats/upgrade
|
| Client chỉ gửi:
|
| {
|   "stat": "STR"
| }
|
| Server tự:
| - kiểm tra attributePoints
| - tăng stat
| - giảm attributePoints
|--------------------------------------------------------------------------
*/

const upgradeStat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { stat } = req.body;

    const allowedStats = [
      "STR",
      "VIT",
      "AGI",
      "INT",
      "END",
      "LUK",
    ];

    if (!allowedStats.includes(stat)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stat",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    if (player.attributePoints <= 0) {
      return res.status(400).json({
        success: false,
        message: "Not enough attribute points",
      });
    }

    player.stats[stat] += 1;
    player.attributePoints -= 1;

    await player.save();

    return res.status(200).json({
      success: true,
      message: `${stat} upgraded successfully`,
      stats: player.stats,
      attributePoints: player.attributePoints,
    });
  } catch (error) {
    console.error("upgradeStat error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| USE ITEM
|--------------------------------------------------------------------------
| POST /player/inventory/use
|
| Client:
|
| {
|   "itemId": "..."
| }
|
| Server kiểm tra inventory trước.
|--------------------------------------------------------------------------
*/

const useItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.body;

    if (!isValidObjectId(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid itemId",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const inventoryItem = player.inventory.find(
      (item) => item.itemId.toString() === itemId
    );

    if (!inventoryItem) {
      return res.status(400).json({
        success: false,
        message: "Item not found in inventory",
      });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Item effect
    |--------------------------------------------------------------------------
    |
    | Phần này phụ thuộc vào Item model của bạn.
    |
    | Ví dụ item có:
    | type: "consumable"
    | effect: {
    |   health: 50,
    |   mana: 20
    | }
    |
    */

    if (item.type !== "consumable") {
      return res.status(400).json({
        success: false,
        message: "This item cannot be used",
      });
    }

    // Ví dụ hồi HP
    if (item.effect?.health) {
      player.health.current = Math.min(
        player.health.current + item.effect.health,
        player.health.max
      );
    }

    // Ví dụ hồi Mana
    if (item.effect?.mana) {
      player.mana.current = Math.min(
        player.mana.current + item.effect.mana,
        player.mana.max
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Remove item
    |--------------------------------------------------------------------------
    */

    inventoryItem.amount -= 1;

    if (inventoryItem.amount <= 0) {
      player.inventory = player.inventory.filter(
        (item) => item.itemId.toString() !== itemId
      );
    }

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Item used successfully",
      health: player.health,
      mana: player.mana,
      inventory: player.inventory,
    });
  } catch (error) {
    console.error("useItem error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| EQUIP ITEM
|--------------------------------------------------------------------------
| POST /player/inventory/equip
|
| Client:
|
| {
|   "itemId": "...",
|   "slot": "weapon"
| }
|--------------------------------------------------------------------------
*/

const equipItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId, slot } = req.body;

    const allowedSlots = [
      "weapon",
      "armor",
      "helmet",
      "ring",
    ];

    if (!allowedSlots.includes(slot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment slot",
      });
    }

    if (!isValidObjectId(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid itemId",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check inventory
    |--------------------------------------------------------------------------
    */

    const inventoryItem = player.inventory.find(
      (item) => item.itemId.toString() === itemId
    );

    if (!inventoryItem) {
      return res.status(400).json({
        success: false,
        message: "Item not found in inventory",
      });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check item type
    |--------------------------------------------------------------------------
    |
    | Ví dụ Item model:
    |
    | type:
    | weapon
    | armor
    | helmet
    | ring
    |--------------------------------------------------------------------------
    */

    if (item.type !== slot) {
      return res.status(400).json({
        success: false,
        message: `This item cannot be equipped as ${slot}`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Equip
    |--------------------------------------------------------------------------
    */

    player.equippedItems[slot] = item._id;

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Item equipped successfully",
      equippedItems: player.equippedItems,
    });
  } catch (error) {
    console.error("equipItem error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UNEQUIP ITEM
|--------------------------------------------------------------------------
| POST /player/inventory/unequip
|
| Client:
|
| {
|   "slot": "weapon"
| }
|--------------------------------------------------------------------------
*/

const unequipItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { slot } = req.body;

    const allowedSlots = [
      "weapon",
      "armor",
      "helmet",
      "ring",
    ];

    if (!allowedSlots.includes(slot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment slot",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    player.equippedItems[slot] = null;

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Item unequipped successfully",
      equippedItems: player.equippedItems,
    });
  } catch (error) {
    console.error("unequipItem error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| LEARN SKILL
|--------------------------------------------------------------------------
| POST /player/skills/learn
|
| Client:
|
| {
|   "skillId": "..."
| }
|
|--------------------------------------------------------------------------
*/

const learnSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillId } = req.body;

    if (!isValidObjectId(skillId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skillId",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Đã học skill?
    const alreadyLearned = player.learnedSkills.some(
      (skill) => skill.skillId.toString() === skillId
    );

    if (alreadyLearned) {
      return res.status(400).json({
        success: false,
        message: "Skill already learned",
      });
    }

    const skill = await Skill.findById(skillId);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | TODO:
    | Kiểm tra điều kiện học skill.
    |
    | Ví dụ:
    | - requiredLevel
    | - requiredItem
    | - quest requirement
    |--------------------------------------------------------------------------
    */

    if (
      skill.requiredLevel &&
      player.level < skill.requiredLevel
    ) {
      return res.status(400).json({
        success: false,
        message: `Level ${skill.requiredLevel} required`,
      });
    }

    player.learnedSkills.push({
      skillId: skill._id,
      level: 1,
    });

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Skill learned successfully",
      learnedSkills: player.learnedSkills,
    });
  } catch (error) {
    console.error("learnSkill error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ACCEPT QUEST
|--------------------------------------------------------------------------
| POST /player/quests/accept
|
| {
|   "questId": "..."
| }
|--------------------------------------------------------------------------
*/

const acceptQuest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { questId } = req.body;

    if (!isValidObjectId(questId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid questId",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const existingQuest = player.quests.find(
      (quest) => quest.questId.toString() === questId
    );

    if (existingQuest) {
      return res.status(400).json({
        success: false,
        message: "Quest already exists",
      });
    }

    const quest = await Quest.findById(questId);

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: "Quest not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Tạo objectives runtime cho player
    |--------------------------------------------------------------------------
    */

    const objectives = (quest.objectives || []).map(
      (objective) => ({
        objectiveId: objective._id,
        current: 0,
        required: objective.required || 1,
        completed: false,
      })
    );

    player.quests.push({
      questId: quest._id,
      status: "active",
      timeLeft: quest.timeLimit || 0,
      objectives,
    });

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Quest accepted successfully",
      quests: player.quests,
    });
  } catch (error) {
    console.error("acceptQuest error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| COMPLETE QUEST
|--------------------------------------------------------------------------
| POST /player/quests/complete
|
| {
|   "questId": "..."
| }
|
| Server kiểm tra objective trước khi complete.
|--------------------------------------------------------------------------
*/

const completeQuest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { questId } = req.body;

    if (!isValidObjectId(questId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid questId",
      });
    }

    const player = await getPlayerByUserId(userId);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const playerQuest = player.quests.find(
      (quest) => quest.questId.toString() === questId
    );

    if (!playerQuest) {
      return res.status(404).json({
        success: false,
        message: "Quest not found in player quests",
      });
    }

    if (playerQuest.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Quest is not active",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check objectives
    |--------------------------------------------------------------------------
    */

    const allCompleted = playerQuest.objectives.every(
      (objective) =>
        objective.completed ||
        objective.current >= objective.required
    );

    if (!allCompleted) {
      return res.status(400).json({
        success: false,
        message: "Quest objectives are not completed",
      });
    }

    const quest = await Quest.findById(questId);

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: "Quest not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Complete quest
    |--------------------------------------------------------------------------
    */

    playerQuest.status = "completed";

    /*
    |--------------------------------------------------------------------------
    | Reward
    |--------------------------------------------------------------------------
    |
    | Server tự cấp reward.
    |--------------------------------------------------------------------------
    */

    if (quest.reward?.gold) {
      player.gold += quest.reward.gold;
    }

    if (quest.reward?.exp) {
      player.exp += quest.reward.exp;
    }

    if (quest.reward?.items?.length) {
      for (const rewardItem of quest.reward.items) {
        const existingItem = player.inventory.find(
          (item) =>
            item.itemId.toString() ===
            rewardItem.itemId.toString()
        );

        if (existingItem) {
          existingItem.amount += rewardItem.amount;
        } else {
          player.inventory.push({
            itemId: rewardItem.itemId,
            amount: rewardItem.amount,
          });
        }
      }
    }

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Quest completed successfully",
      reward: quest.reward,
      player: {
        gold: player.gold,
        exp: player.exp,
        level: player.level,
      },
    });
  } catch (error) {
    console.error("completeQuest error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
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
};


