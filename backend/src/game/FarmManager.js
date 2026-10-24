// game/FarmManager.js
// Quản lý ruộng farm từng người chơi (server-authoritative).
// Mỗi player có 6 ô đất. plant → growing → ready → harvest → vào kho (ScoreManager).
// Client → Server: plant_crop {plotId, cropType}, harvest_crop {plotId}
// Server → Client: farm_plots {plots}, plot_updated {plot}

const CROP_TYPES = {
  carrot:  { growTimeSec: 60,  name: "Cà rốt" },
  corn:    { growTimeSec: 120, name: "Bắp" },
  pumpkin: { growTimeSec: 180, name: "Bí ngô" },
};

const PLOTS_PER_PLAYER = 6;

class FarmManager {
  constructor({ io, scoreManager }) {
    this.io = io;
    this.scoreManager = scoreManager; // để harvest cộng vào kho
    this.plots = new Map(); // plotId -> plot
    this.tickInterval = null;
  }

  start() {
    this.tickInterval = setInterval(() => this.tick(), 1000);
    console.log("[Farm] FarmManager chạy");
  }

  stop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  // Tạo 6 ô đất cho player mới (gọi khi player join)
  ensurePlayerPlots(playerId) {
    let count = 0;
    for (const plot of this.plots.values()) {
      if (plot.ownerId === playerId) count++;
    }
    if (count >= PLOTS_PER_PLAYER) return;
    for (let i = count; i < PLOTS_PER_PLAYER; i++) {
      const plotId = `${playerId}_plot_${i}`;
      this.plots.set(plotId, {
        plotId,
        ownerId: playerId,
        gridX: i % 3,
        gridY: Math.floor(i / 3),
        state: "empty", // empty | growing | ready
        cropType: null,
        readyAt: 0,
      });
    }
    console.log(`[Farm] Tạo ${PLOTS_PER_PLAYER} ô đất cho ${playerId}`);
  }

  getPlayerPlots(playerId) {
    return [...this.plots.values()].filter((p) => p.ownerId === playerId);
  }

  plantCrop(playerId, plotId, cropType) {
    const plot = this.plots.get(plotId);
    if (!plot || plot.ownerId !== playerId)
      return { ok: false, error: "PLOT_NOT_YOURS" };
    if (plot.state !== "empty")
      return { ok: false, error: "PLOT_NOT_EMPTY" };
    if (!CROP_TYPES[cropType])
      return { ok: false, error: "INVALID_CROP" };

    plot.state = "growing";
    plot.cropType = cropType;
    plot.readyAt = Date.now() + CROP_TYPES[cropType].growTimeSec * 1000;
    this.io.emit("plot_updated", { plot: this.serialize(plot) });
    return { ok: true };
  }

  harvestCrop(playerId, plotId) {
    const plot = this.plots.get(plotId);
    if (!plot || plot.ownerId !== playerId)
      return { ok: false, error: "PLOT_NOT_YOURS" };
    if (plot.state !== "ready")
      return { ok: false, error: "NOT_READY" };

    // Thu hoạch → vào kho (chưa có điểm!)
    this.scoreManager.addToWarehouse(playerId, plot.cropType, 1);

    plot.state = "empty";
    plot.cropType = null;
    plot.readyAt = 0;
    this.io.emit("plot_updated", { plot: this.serialize(plot) });
    return { ok: true, cropType: plot.cropType };
  }

  tick() {
    const now = Date.now();
    for (const plot of this.plots.values()) {
      if (plot.state === "growing" && now >= plot.readyAt) {
        plot.state = "ready";
        this.io.emit("plot_updated", { plot: this.serialize(plot) });
      }
    }
  }

  serialize(plot) {
    return {
      plotId: plot.plotId,
      ownerId: plot.ownerId,
      gridX: plot.gridX,
      gridY: plot.gridY,
      state: plot.state,
      cropType: plot.cropType,
      readyInSec: plot.state === "growing"
        ? Math.max(0, Math.ceil((plot.readyAt - Date.now()) / 1000))
        : 0,
    };
  }

  // Socket handlers — gọi từ SocketManager
  registerSocketHandlers(socket) {
    socket.on("plant_crop", ({ plotId, cropType }) => {
      const res = this.plantCrop(socket.userId, plotId, cropType);
      socket.emit("plant_crop_result", res);
    });
    socket.on("harvest_crop", ({ plotId }) => {
      const res = this.harvestCrop(socket.userId, plotId);
      socket.emit("harvest_crop_result", res);
    });
    // Gửi toàn bộ plots của player khi join
    socket.on("request_farm", () => {
      this.ensurePlayerPlots(socket.userId);
      socket.emit("farm_plots", {
        plots: this.getPlayerPlots(socket.userId).map((p) => this.serialize(p)),
      });
    });
  }
}

module.exports = { FarmManager, CROP_TYPES };
