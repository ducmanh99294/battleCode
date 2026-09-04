const jwt = require("jsonwebtoken");
const Player = require("../models/Player");

class SocketManager {
constructor(io, {
  playerManager,
  zoneManager,
  monsterManager,
  worldManager,
  combatManager,
  lootManager,
}) {
  this.io = io;

  this.playerManager = playerManager;
  this.zoneManager = zoneManager;
  this.monsterManager = monsterManager;
  this.worldManager = worldManager;

  this.combatManager = combatManager;
  this.lootManager = lootManager;

  this.worldSyncInterval = null;
}

//   | Initialize

  initialize() {
    // | Auth Middleware
    // |
    // | Verify JWT trước khi cho connect.

    this.io.use((socket, next) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("NO_TOKEN"));
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        socket.userId   = decoded.userId;
        socket.username = decoded.username;

        next();
      } catch {
        next(new Error("INVALID_TOKEN"));
      }
    });

    this.io.on("connection", (socket) => {
      console.log(
        `[Socket] Connected: ${socket.username} (${socket.id})`
      );

      this._registerEvents(socket);

    //   | Disconnect

      socket.on("disconnect", () => {
        this._handleDisconnect(socket);
      });
    });

    // | Start World Sync

    this._startWorldSync();

    console.log("[Socket] SocketManager initialized");
  }

//   | Register Events

  _registerEvents(socket) {
    // | join_world
    // |
    // | Player vào game — load vị trí từ DB,
    // | thêm vào PlayerManager + ZoneManager.


    socket.on("join_world", async (data, callback) => {
      try {
        const playerId = socket.userId;

        // | Load player từ DB

        const dbPlayer = await Player.findOne({
          userId: playerId,
        });

        if (!dbPlayer) {
          return callback?.({
            success: false,
            reason: "PLAYER_NOT_FOUND",
          });
        }

        const scene =
          data?.scene ||
          dbPlayer.position?.scene ||
          "Village";

        const x =
          data?.x ??
          dbPlayer.position?.x ??
          0;

        const y =
          data?.y ??
          dbPlayer.position?.y ??
          0;

        // | Lấy hoặc tạo zone cho scene

        const zone =
          this.zoneManager.getOrCreateZone({
            scene,
            maxPlayers: 50,
          });

        // | Thêm player vào PlayerManager

        const player =
          this.playerManager.addPlayer({
            playerId,
            socketId: socket.id,
            username: socket.username,
            scene,
            zoneId: zone.zoneId,
            x,
            y,
          });

        // | Thêm player vào Zone

        this.zoneManager.addPlayerToZone(
          playerId,
          zone.zoneId
        );

        // | Join socket room theo zone

        socket.join(zone.zoneId);

        // | Gửi world state hiện tại cho player mới

        const worldState =
          this.worldManager.getWorld();

        socket.emit("world_state", worldState);

        // | Gửi danh sách player cùng zone

        const playersInZone =
          this.playerManager.getPublicPlayersInZone(
            zone.zoneId
          );

        socket.emit("zone_players", {
          zoneId: zone.zoneId,
          players: playersInZone,
        });

        // | Gửi danh sách monster trong zone

        const monstersInZone =
          this.monsterManager.getPublicMonstersInZone(
            zone.zoneId
          );

        socket.emit("zone_monsters", {
          zoneId: zone.zoneId,
          monsters: monstersInZone,
        });

        // | Thông báo player khác trong zone

        socket.to(zone.zoneId).emit(
          "player_joined",
          this.playerManager.getPublicPlayerData(playerId)
        );

        console.log(
          `[Socket] ${socket.username} joined zone: ${zone.zoneId}`
        );

        callback?.({
          success: true,
          player,
          zoneId: zone.zoneId,
          worldState,
        });
      } catch (err) {
        console.error("[Socket] join_world error:", err);
        callback?.({ success: false, reason: err.message });
      }
    });

    // | player_move
    // |
    // | Client gửi vị trí mới.
    // | Server update RAM + broadcast cho zone.

    socket.on("player_move", (data) => {
      const playerId = socket.userId;

      const player =
        this.playerManager.getPlayer(playerId);

      if (!player) return;

      const { x, y } = data;

      if (
        typeof x !== "number" ||
        typeof y !== "number"
      ) return;

      this.playerManager.updatePosition(
        playerId,
        x,
        y
      );

    //   | Broadcast cho player khác trong cùng zone

      socket.to(player.zoneId).emit(
        "player_moved",
        {
          playerId,
          x,
          y,
        }
      );
    });

    // | scene_changed
    // |
    // | Player đổi scene (vào nhà, dungeon...).

    socket.on("scene_changed", async (data, callback) => {
      try {
        const playerId = socket.userId;

        const player =
          this.playerManager.getPlayer(playerId);

        if (!player) {
          return callback?.({
            success: false,
            reason: "PLAYER_NOT_FOUND",
          });
        }

        const oldZoneId = player.zoneId;
        const newScene  = data.scene;

        // | Lấy hoặc tạo zone mới

        const newZone =
          this.zoneManager.getOrCreateZone({
            scene: newScene,
            maxPlayers: 50,
          });

        // | Thông báo zone cũ player đã rời

        socket.to(oldZoneId).emit(
          "player_left",
          { playerId }
        );

        // | Rời socket room cũ

        socket.leave(oldZoneId);

        // | Move player sang zone mới

        this.zoneManager.movePlayer(
          playerId,
          oldZoneId,
          newZone.zoneId
        );

        this.playerManager.updateScene(
          playerId,
          newScene,
          newZone.zoneId
        );

        // | Join socket room mới

        socket.join(newZone.zoneId);

        // | Thông báo zone mới có player vào

        socket.to(newZone.zoneId).emit(
          "player_joined",
          this.playerManager.getPublicPlayerData(playerId)
        );

        // | Gửi danh sách player + monster trong zone mới

        socket.emit("zone_players", {
          zoneId: newZone.zoneId,
          players: this.playerManager.getPublicPlayersInZone(
            newZone.zoneId
          ),
        });

        socket.emit("zone_monsters", {
          zoneId: newZone.zoneId,
          monsters: this.monsterManager.getPublicMonstersInZone(
            newZone.zoneId
          ),
        });

        console.log(
          `[Socket] ${socket.username} moved to zone: ${newZone.zoneId}`
        );

        callback?.({
          success: true,
          zoneId: newZone.zoneId,
        });
      } catch (err) {
        console.error("[Socket] scene_changed error:", err);
        callback?.({ success: false, reason: err.message });
      }
    });

    // | monster_attack
    // |
    // | Client báo player tấn công monster.
    // | Server kiểm tra và apply damage.
    
    socket.on("monster_attack", (data, callback) => {
      try {
        const playerId = socket.userId;

        const monsterId =
          data?.monsterId;

        const attackId =
          data?.attackId || "basic_attack";

        if (!monsterId) {
          return callback?.({
            success: false,
            reason: "MONSTER_ID_REQUIRED",
          });
        }

        const result =
          this.combatManager.attackMonster({
            playerId,
            monsterId,
            attackId,
          });

        callback?.(result);

      } catch (err) {
        console.error(
          "[Socket] monster_attack error:",
          err
        );

        callback?.({
          success: false,
          reason: "COMBAT_ERROR",
        });
      }
    });

    // | save_player
    // |
    // | Lưu player data xuống MongoDB.
    // | Gọi mỗi 30s hoặc khi đổi scene.

    socket.on("save_player", async (data, callback) => {
      try {
        const result =
          await this.playerManager.savePlayer(
            socket.userId
          );

        callback?.(result);
      } catch (err) {
        console.error(
          "[Socket] save_player error:",
          err
        );

        callback?.({
          success: false,
          reason: "SAVE_FAILED",
        });
      }
    });

    
    // | loot_picked
    // |
    // | Thông báo item đã được nhặt → xóa khỏi map.

    socket.on("loot_pickup", (data, callback) => {
      try {
        const lootId =
          data?.lootId;

        if (!lootId) {
          return callback?.({
            success: false,
            reason: "LOOT_ID_REQUIRED",
          });
        }

        const result =
          this.lootManager.pickupLoot(
            socket.userId,
            lootId
          );

        callback?.(result);

      } catch (err) {
        console.error(
          "[Socket] loot_pickup error:",
          err
        );

        callback?.({
          success: false,
          reason: "LOOT_PICKUP_FAILED",
        });
      }
    });

    // | chat_message

    socket.on("chat_message", (data) => {
      const player =
        this.playerManager.getPlayer(socket.userId);

      if (!player) return;

      const message = {
        playerId: socket.userId,
        username: socket.username,
        message:  data.message?.substring(0, 200),
        zoneId:   player.zoneId,
        timestamp: Date.now(),
      };

    //   | Gửi cho cả zone

      this.io.to(player.zoneId).emit(
        "chat_message",
        message
      );
    });
  }

//   | Handle Disconnect
  _handleDisconnect(socket) {
    const playerId = socket.userId;

    const player =
      this.playerManager.getPlayer(playerId);

    if (player) {
    //   | Thông báo zone player đã rời

      socket.to(player.zoneId).emit(
        "player_left",
        { playerId }
      );

    //   | Xóa khỏi ZoneManager

      if (player.zoneId) {
        this.zoneManager.removePlayerFromZone(
          playerId,
          player.zoneId
        );
      }

    //   | Xóa khỏi PlayerManager

      this.playerManager.removePlayer(playerId);
    }

    console.log(
      `[Socket] Disconnected: ${socket.username} (${socket.id})`
    );
  }

//   | Start World Sync
//   |
//   | Broadcast world state mỗi 1 giây.

  _startWorldSync() {
    this.worldSyncInterval =
      setInterval(() => {
        const worldState =
          this.worldManager.getWorld();

        if (!worldState) return;

        this.io.emit(
          "world_sync",
          {
            time:    worldState.time,
            day:     worldState.day,
            weather: worldState.weather,
            moon:    worldState.moon,
          }
        );
      }, 1000);

    console.log("[Socket] World sync started");
  }

//   | Broadcast To Zone
//   |
//   | Helper để các Manager khác broadcast.

  broadcastToZone(zoneId, event, data) {
    this.io.to(zoneId).emit(event, data);
  }

//   | Stop

  stop() {
    if (this.worldSyncInterval) {
      clearInterval(this.worldSyncInterval);
      this.worldSyncInterval = null;
    }
  }

  _calculatePlayerDamage(player, attackId) {
  // Tạm thời để test
  // SAU NÀY thay bằng hệ thống combat thật

  const baseDamage =
    player.stats?.STR || 1;

  return Math.max(
    1,
    Math.floor(baseDamage)
  );
}

}



module.exports = SocketManager;