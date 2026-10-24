// game/TunnelManager.js
// Mạng lưới đường hầm: nhà ↔ dungeon (server-authoritative).
// Mỗi nhà có 1 đường hầm 2 chiều: hầm nhà ↔ cửa hầm trong dungeon.
// Client → Server: use_tunnel {tunnelId}, request_tunnels {}
// Server → Client: tunnel_list {tunnels}, tunnel_result, player_teleported

class TunnelManager {
  constructor({ io, playerManager }) {
    this.io = io;
    this.playerManager = playerManager;
    this.tunnels = new Map(); // tunnelId -> { tunnelId, houseOwnerId, housePos, dungeonPos }
    // Ghi nhớ player đang ở nhà ai (để check trộm)
    this.playerLocations = new Map(); // playerId -> houseOwnerId | 'dungeon' | 'wild'
  }

  // Đăng ký đường hầm cho 1 nhà (gọi lúc setup match)
  // housePos/dungeonPos: {x, y, scene}
  registerTunnel(houseOwnerId, housePos, dungeonPos) {
    const tunnelId = `tunnel_${houseOwnerId}`;
    this.tunnels.set(tunnelId, { tunnelId, houseOwnerId, housePos, dungeonPos });
    console.log(`[Tunnel] Đăng ký ${tunnelId}: nhà(${housePos.x},${housePos.y}) ↔ dungeon(${dungeonPos.x},${dungeonPos.y})`);
  }

  getTunnels() {
    return [...this.tunnels.values()];
  }

  // Player đang ở nhà của ai (để StealManager check)
  getPlayerLocation(playerId) {
    return this.playerLocations.get(playerId) || "wild";
  }

  useTunnel(playerId, tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) return { ok: false, error: "NO_TUNNEL" };

    const player = this.playerManager.getPlayer(playerId);
    if (!player) return { ok: false, error: "NO_PLAYER" };

    // Đang ở dungeon → về nhà của tunnel này; ngược lại → xuống dungeon
    const currentScene = player.position?.scene || "";
    let dest, newLocation;
    if (currentScene === "dungeon") {
      dest = tunnel.housePos;
      newLocation = tunnel.houseOwnerId; // đang ở nhà ai
    } else {
      dest = tunnel.dungeonPos;
      newLocation = "dungeon";
    }

    // Cập nhật vị trí player
    if (player.position) {
      player.position.x = dest.x;
      player.position.y = dest.y;
      player.position.scene = dest.scene;
    }
    this.playerLocations.set(playerId, newLocation);

    console.log(`[Tunnel] ${playerId} dùng ${tunnelId} → (${dest.x},${dest.y},${dest.scene})`);
    this.io.emit("player_teleported", {
      playerId, x: dest.x, y: dest.y, scene: dest.scene,
    });
    return { ok: true, x: dest.x, y: dest.y, scene: dest.scene };
  }

  registerSocketHandlers(socket) {
    socket.on("use_tunnel", ({ tunnelId }) => {
      const res = this.useTunnel(socket.userId, tunnelId);
      socket.emit("tunnel_result", res);
    });
    socket.on("request_tunnels", () => {
      socket.emit("tunnel_list", { tunnels: this.getTunnels() });
    });
  }
}

module.exports = { TunnelManager };
