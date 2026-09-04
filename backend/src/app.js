require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

/*
| Routes
*/

const authRoutes = require("./routes/authRoutes");
const playerRoutes = require("./routes/playerRoutes");

/*
| Managers
*/

const PlayerManager = require("./game/PlayerManager");
const ZoneManager = require("./game/ZoneManager");
const MonsterManager = require("./game/MonsterManager");
const WorldManager = require("./game/WorldManager");
const CombatManager = require("./game/CombatManager");
const LootManager = require("./game/LootManager");
const SocketManager = require("./game/SocketManager");
const monsterRoutes = require("./routes/monsterRoutes");

/*
| App Setup
*/

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/*
| Middleware
*/

app.use(cors());
app.use(express.json());

/*
| Init Managers
*/

const playerManager = new PlayerManager();

const zoneManager = new ZoneManager();

const lootManager =
  new LootManager({
    io,
    playerManager,
  });
  
const monsterManager = new MonsterManager(
  zoneManager,
  lootManager
);


const combatManager =
  new CombatManager({
    playerManager,
    monsterManager,
  });
const worldManager = new WorldManager();

/*
| Init Socket
*/

const socketManager = new SocketManager(io, {

  playerManager,
  zoneManager,
  monsterManager,
  worldManager,
  combatManager,
  lootManager
});

socketManager.initialize();

lootManager.startCleanup();
/*
| REST Routes
*/

app.use("/api/auth", authRoutes);
app.use("/api/monsters", monsterRoutes);
app.use("/api/player", playerRoutes);

/*
| Health Check
*/

app.get("/", (req, res) => {
  res.json({
    status: "Terra Reclaim Server Running",
    players: playerManager.getPlayerCount(),
  });
});

/*
| Connect MongoDB
*/

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("[DB] MongoDB connected");

    /*
    | Initialize World
    |
    | WorldManager sẽ:
    | 1. Load World từ MongoDB
    | 2. Nếu chưa có → tạo World mặc định
    | 3. Load World vào RAM
    | 4. Start World Loop
    |
    */

    await worldManager.initialize();

    console.log("[World] World initialized");

    /*
    | Start Server
    */

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log(
        `[Server] Running on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error(
      "[DB] Connection failed:",
      err
    );

    process.exit(1);
  });

/*
| Graceful Shutdown
*/

process.on("SIGINT", async () => {
  console.log("[Server] Shutting down...");

  socketManager.stop();

  worldManager.stop();

  await mongoose.disconnect();

  process.exit(0);
});

module.exports = app;
