// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const cookie = require("cookie");
// const User = require("../models/User");
// const chatController = require("../controllers/chatController");
// const gameController = require("../controllers/battleCode/gameController");

// let io;

// let dungeonQueue = [];
// const MAX_PARTY = 2;
// const dungeons = {};

// const initSocket = (server) => {
//   io = new Server(server, {
//     cors: {
//       origin: "http://localhost:5173",
//       credentials: true
//     }
//   });

//   io.use((socket, next) => {
//     const cookies = socket.handshake.headers.cookie;
//     if (!cookies) return next(new Error("No cookies"));

//     const parsed = cookie.parse(cookies);
//     const token = parsed.accessToken;

//     if (!token) return next(new Error("No token"));

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//       socket.userId = decoded.id;
//       next();
//     } catch (err) {
//       next(new Error("Invalid token"));
//     }
//   });

//   io.on("connection", (socket) => {
//     socket.join(`user_${socket.userId}`);

//     // validate profile
//     socket.on("user_ready", async () => {
//       const user = await User.findById(socket.userId);
//       const missingFields = getMissingFields(user);

//       if (missingFields.length > 0) {
//         sendNotification(socket.userId, {
//           type: "incomplete_profile",
//           message: `Vui lòng cập nhật: ${missingFields.join(", ")}`
//         });
//       }
//     });
//     // chat AI
//     // socket.on("send_message", async (data) => {
//     //   console.log("AI request:", data);
//     //   try {
//     //     const reply = await chatController.processAIChat(
//     //       socket.userId,
//     //       data.message
//     //     );

//     //     socket.emit("ai_reply", {
//     //       role: "assistant",
//     //       message: reply
//     //     });

//     //   } catch (error) {
//     // console.error("AI ERROR:", error);
//     //     socket.emit("ai_reply", {
//     //       role: "assistant",
//     //       message: "AI đang gặp lỗi."
//     //     });
//     //   }
//     // });

//     // socket.on("join_chat", (conversationId) => {
//     //   socket.join(`chat_${conversationId}`);
//     // });

//     // socket.on("send_chat_message", ({ conversationId, message }) => {
//     //   io.to(`chat_${conversationId}`).emit("receive_chat_message", {
//     //     sender: socket.userId,
//     //     message
//     //   });
//     // });

// socket.on("join_dungeon_queue", () => {
//   if (dungeonQueue.includes(socket.userId)) return;

//   dungeonQueue.push(socket.userId);

//   if (dungeonQueue.length >= MAX_PARTY) {
//     const party = dungeonQueue.splice(0, MAX_PARTY);
//     createDungeon(party);
//   }
// });

// socket.on("join_dungeon", (dungeonId) => {
//   const dungeon = dungeons[dungeonId];
//   if (!dungeon) return;

//   socket.join(dungeonId);
//   socket.emit("dungeon_state", dungeon);
// });

// socket.on("player_action", async (data) => {
//   const result = await gameController.handlePlayerAction(socket, data);

//   if (result.error) {
//     return socket.emit("error", result.error);
//   }

//   io.to(data.dungeonId).emit("dungeon_update", result);

//   if (result.isEnd) {
//     io.to(data.dungeonId).emit("dungeon_end", result);
//   }
// });

//     socket.on("disconnect", () => {
//       // Giữ kết nối đóng yên lặng, tránh spam log terminal
//     });

    
//   });
// };
//  // notify
// const sendNotification = (userId, data) => {
//   if (!io) {
//     console.log("Socket chưa được init");
//     return;
//   }

//   io.to(`user_${userId}`).emit("notification", data);
// };

// //battle code

// const createDungeon = (players) => {
//   const dungeonId = `dungeon_${Date.now()}`;

//   const dungeon = {
//     id: dungeonId,
//     players,
//     stage: 1,
//     enemies: generateEnemies(1),
//     playerStats: {},
//     turn: 0
//   };

//   // init player
//   players.forEach(p => {
//     dungeon.playerStats[p] = {
//       hp: 100,
//       mana: 50
//     };
//   });

//   dungeons[dungeonId] = dungeon;

//   // join room
//   io.sockets.sockets.forEach((s) => {
//     if (players.includes(s.userId)) {
//       s.join(dungeonId);
//     }
//   });

//   // emit start
//   players.forEach(p => {
//     io.to(`user_${p}`).emit("dungeon_start", {
//       dungeonId,
//       players
//     });
//   });
// };

// const generateEnemies = (stage) => {
//   return [
//     {
//       id: "enemy_1",
//       hp: 50 + stage * 10,
//       attack: 10
//     },
//     {
//       id: "enemy_2",
//       hp: 50 + stage * 10,
//       attack: 10
//     }
//   ];
// };

// const applyAction = (dungeon, userId, action) => {
//   if (action.type === "attack") {
//     const enemy = dungeon.enemies.find(e => e.id === action.target);
//     if (!enemy) return;

//     enemy.hp -= action.damage;
//   }

//   if (action.type === "heal") {
//     dungeon.playerStats[userId].hp += action.value;
//   }
// };

// const enemyTurn = (dungeon) => {
//   dungeon.enemies.forEach(enemy => {
//     if (enemy.hp <= 0) return;

//     const players = Object.keys(dungeon.playerStats);
//     const target = players[Math.floor(Math.random() * players.length)];

//     dungeon.playerStats[target].hp -= enemy.attack;
//   });
// };

// const checkDungeonState = (dungeon) => {
//   const allEnemiesDead = dungeon.enemies.every(e => e.hp <= 0);
//   const allPlayersDead = Object.values(dungeon.playerStats)
//     .every(p => p.hp <= 0);

//   if (allEnemiesDead) {
//     dungeon.stage += 1;
//     dungeon.enemies = generateEnemies(dungeon.stage);
//   }

//   if (allPlayersDead) {
//     io.to(dungeon.id).emit("dungeon_lose");
//     delete dungeons[dungeon.id];
//   }
// };

// exports.processTurn = (dungeon, userId, action) => {
//   // player attack
//   applyAction(dungeon, userId, action);

//   // enemy attack
//   enemyTurn(dungeon);

//   return dungeon;
// };
// module.exports = {
//   initSocket,
//   sendNotification,
//   createDungeon,
//   generateEnemies,
//   applyAction,
//   enemyTurn,
//   checkDungeonState
// };
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

// controllers
const gameController = require("../controllers/battleCode/gameController");
const matchmakingController = require("../controllers/battleCode/matchmakingController");
const dungeonController = require("../controllers/battleCode/dungeonController");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  });

  // 🔐 AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) throw new Error("No cookies");

      const parsed = cookie.parse(cookies);
      const token = parsed.accessToken;

      if (!token) throw new Error("No token");

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  // 🔌 CONNECTION
  io.on("connection", (socket) => {
    console.log("User connected:", socket.userId);

    // join private room
    socket.join(`user_${socket.userId}`);

    // =========================
    // 🎮 MATCHMAKING
    // =========================

    socket.on("join_queue", () => {
      const result = matchmakingController.joinQueue(socket);

      if (!result) {
        return socket.emit("queue_waiting");
      }

      const { dungeonId, dungeon, players } = result;

      players.forEach(p => {
        io.to(`user_${p.userId}`).emit("match_found", {
          dungeonId,
          dungeon
        });
      });
    });

    socket.on("leave_queue", () => {
      matchmakingController.leaveQueue(socket);
    });

    // =========================
    // 🏰 DUNGEON
    // =========================

    socket.on("join_dungeon", (dungeonId) => {
      const dungeon = dungeonController.getDungeon(dungeonId);

      if (!dungeon) {
        return socket.emit("error", "Dungeon not found");
      }

      socket.join(dungeonId);
      socket.emit("dungeon_update", dungeon);
    });

    socket.on("leave_dungeon", (dungeonId) => {
      const updated = dungeonController.leaveDungeon(socket, dungeonId);

      if (updated) {
        io.to(dungeonId).emit("dungeon_update", updated);
      }
    });

    // =========================
    // ⚔️ GAME PLAY
    // =========================

    socket.on("player_action", async (data) => {
      try {
        const result = await gameController.handlePlayerAction(socket, data);

        if (result.error) {
          return socket.emit("error", result.error);
        }

        // update all players
        io.to(data.dungeonId).emit("dungeon_update", result);

        // 🏁 end game
        if (result.isEnd) {
          io.to(data.dungeonId).emit("game_over", result);
        }

      } catch (err) {
        console.error(err);
        socket.emit("error", "Internal server error");
      }
    });

    // =========================
    // 👤 USER READY (OPTIONAL)
    // =========================

    socket.on("user_ready", async () => {
      try {
        const result = await gameController.checkUserReady(socket);

        if (result?.notify) {
          socket.emit("notification", result.notify);
        }

      } catch (err) {
        console.error(err);
      }
    });

    // =========================
    // ❌ DISCONNECT
    // =========================

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);
      matchmakingController.leaveQueue(socket);
    });
  });
};

module.exports = { initSocket };