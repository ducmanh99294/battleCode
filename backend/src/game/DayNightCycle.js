// game/DayNightCycle.js
// Quản lý chu kỳ ngày/đêm cho match 4-8 người (server-authoritative).
// 1 match = totalCycles chu kỳ (mỗi chu kỳ = day + night).
// Broadcast: daynight_update (mỗi giây), phase_changed, match_ended.

class DayNightCycle {
  constructor({
    io,
    dayDurationSec = 150,   // 2.5 phút ngày
    nightDurationSec = 90,  // 1.5 phút đêm
    totalCycles = 6,        // 6 chu kỳ ≈ 24 phút/trận
  }) {
    this.io = io;
    this.dayDurationSec = dayDurationSec;
    this.nightDurationSec = nightDurationSec;
    this.totalCycles = totalCycles;

    this.phase = "day"; // 'day' | 'night'
    this.cycle = 1;
    this.timeLeftSec = dayDurationSec;
    this.running = false;
    this.tickInterval = null;

    this.phaseChangedCallbacks = [];
    this.matchEndedCallbacks = [];
  }

  // ── PUBLIC ──────────────────────────────────────────────────────────

  start() {
    if (this.running) return;
    this.running = true;
    this.phase = "day";
    this.cycle = 1;
    this.timeLeftSec = this.dayDurationSec;
    console.log(`[DayNight] Match bắt đầu — ${this.totalCycles} chu kỳ`);
    this.broadcastState();
    this.tickInterval = setInterval(() => this.tick(), 1000);
  }

  stop() {
    this.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    console.log("[DayNight] Match dừng");
  }

  // State hiện tại (gửi cho player mới join giữa trận)
  getState() {
    return {
      phase: this.phase,
      cycle: this.cycle,
      totalCycles: this.totalCycles,
      timeLeftSec: this.timeLeftSec,
      dayDurationSec: this.dayDurationSec,
      nightDurationSec: this.nightDurationSec,
      running: this.running,
    };
  }

  isDay() { return this.phase === "day"; }
  isNight() { return this.phase === "night"; }

  // Đăng ký callback (các system khác hook vào: farm, scoring...)
  onPhaseChanged(cb) { this.phaseChangedCallbacks.push(cb); }
  onMatchEnded(cb) { this.matchEndedCallbacks.push(cb); }

  // ── INTERNAL ────────────────────────────────────────────────────────

  tick() {
    if (!this.running) return;
    this.timeLeftSec -= 1;

    if (this.timeLeftSec <= 0) {
      this.nextPhase();
    } else {
      this.broadcastState();
    }
  }

  nextPhase() {
    if (this.phase === "day") {
      this.phase = "night";
      this.timeLeftSec = this.nightDurationSec;
      console.log(`[DayNight] Chu kỳ ${this.cycle}: ĐÊM xuống`);
    } else {
      // Hết đêm → sang chu kỳ mới (hoặc hết match)
      if (this.cycle >= this.totalCycles) {
        this.endMatch();
        return;
      }
      this.cycle += 1;
      this.phase = "day";
      this.timeLeftSec = this.dayDurationSec;
      console.log(`[DayNight] Chu kỳ ${this.cycle}: NGÀY lên`);
    }

    const state = this.getState();
    this.io.emit("phase_changed", state);
    this.broadcastState();
    this.phaseChangedCallbacks.forEach((cb) => {
      try { cb(state); } catch (e) { console.error("[DayNight] phaseChanged cb lỗi:", e); }
    });
  }

  broadcastState() {
    this.io.emit("daynight_update", this.getState());
  }

  endMatch() {
    this.stop();
    console.log(`[DayNight] Hết ${this.totalCycles} chu kỳ — match kết thúc`);
    const payload = { totalCycles: this.totalCycles, endedAt: Date.now() };
    this.io.emit("match_ended", payload);
    this.matchEndedCallbacks.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error("[DayNight] matchEnded cb lỗi:", e); }
    });
  }
}

module.exports = DayNightCycle;
