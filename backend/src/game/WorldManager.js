// game/WorldManager.js

const World = require("../models/World");

class WorldManager {
  constructor() {
    /*
    | Runtime World
    */

    this.world = null;

    /*
    | Update Loop
    */

    this.updateInterval = null;

    /*
    | Real Time Reference
    |
    | Dùng timestamp để tính thời gian game.
    |
    */

    this.lastUpdateTime = Date.now();

    /*
    | Default Time Scale
    |
    | 1 giây thật = 2 phút game
    |
    | 12 phút thật = 24 giờ game
    |
    */

    this.defaultTimeScale = 2;
  }

  /*
  | Initialize
  */

  async initialize() {
    try {
      let world = await World.findOne({
        name: "MainWorld",
      });

      /*
      | Create Default World
      */

      if (!world) {
        world = await World.create({
          name: "MainWorld",

          currentMinute: 720,

          day: 1,

          timeScale: this.defaultTimeScale,

          weather: "clear",

          moon: {
            phase: "new",
            isFullMoon: false,
          },

          isActive: true,
        });

        console.log(
          "[World] Created default world"
        );
      }

      /*
      | Load MongoDB → RAM
      */

      this.world = {
        id: world._id.toString(),

        name: world.name,

        currentMinute:
          world.currentMinute,

        day: world.day,

        timeScale:
          world.timeScale,

        weather:
          world.weather,

        moon: {
          phase:
            world.moon.phase,

          isFullMoon:
            world.moon.isFullMoon,
        },

        isActive:
          world.isActive,
      };

      /*
      | Reset timestamp
      */

      this.lastUpdateTime = Date.now();

      console.log(
        `[World] "${this.world.name}" initialized`
      );

      console.log(
        `[World] Time: ${this.getTimeString()}`
      );

      console.log(
        `[World] Day: ${this.world.day}`
      );

      console.log(
        `[World] Weather: ${this.world.weather}`
      );

      console.log(
        `[World] Moon: ${this.world.moon.phase}`
      );

      /*
      | Start Loop
      */

      this.startWorldLoop();

      return this.getWorld();
    } catch (error) {
      console.error(
        "[World] Initialize error:",
        error
      );

      throw error;
    }
  }

  /*
  | World Loop
  */

  startWorldLoop() {
    if (this.updateInterval) {
      return;
    }

    /*
    | Update mỗi 1 giây.
    |
    | Nhưng thời gian KHÔNG phụ thuộc vào
    | việc interval chạy chính xác 1 giây.
    |
    */

    this.updateInterval = setInterval(() => {
      this.updateWorld();
    }, 1000);

    console.log(
      "[World] World loop started"
    );
  }

  /*
  | Update World
  */

  updateWorld() {
    if (!this.world) {
      return;
    }

    const now = Date.now();

    /*
    | Real Time Passed
    */

    const elapsedSeconds =
      (now - this.lastUpdateTime) / 1000;

    this.lastUpdateTime = now;

    /*
    | Convert Real Time → Game Time
    |
    | timeScale = 2
    |
    | 1 giây thật = 2 phút game
    |
    */

    const gameMinutesPassed =
      elapsedSeconds *
      this.world.timeScale;

    /*
    | Update Game Minute
    */

    this.world.currentMinute +=
      gameMinutesPassed;

    /*
    | New Day
    */

    while (
      this.world.currentMinute >= 1440
    ) {
      this.world.currentMinute -= 1440;

      this.world.day += 1;

      this.updateMoon();
    }
  }

  /*
  | Get World
  */

  getWorld() {
    if (!this.world) {
      return null;
    }

    return {
      id: this.world.id,

      name: this.world.name,

      currentMinute:
        Math.floor(
          this.world.currentMinute
        ),

      time:
        this.getTimeString(),

      day:
        this.world.day,

      weather:
        this.world.weather,

      moon: {
        ...this.world.moon,
      },

      timeScale:
        this.world.timeScale,

      isActive:
        this.world.isActive,
    };
  }

  /*
  | Get Time String
  */

  getTimeString() {
    if (!this.world) {
      return "00:00";
    }

    const totalMinutes =
      Math.floor(
        this.world.currentMinute
      );

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  /*
  | Get Day / Night
  */

  getDayNight() {
    if (!this.world) {
      return "night";
    }

    const minute =
      this.world.currentMinute;

    const hour =
      minute / 60;

    if (
      hour >= 6 &&
      hour < 18
    ) {
      return "day";
    }

    return "night";
  }

  /*
  | Get Weather
  */

  getWeather() {
    return this.world?.weather;
  }

  /*
  | Set Weather
  */

  async setWeather(weather) {
    const allowedWeather = [
      "clear",
      "cloudy",
      "rain",
      "storm",
      "snow",
      "fog",
    ];

    if (
      !allowedWeather.includes(weather)
    ) {
      throw new Error(
        "Invalid weather"
      );
    }

    if (!this.world) {
      throw new Error(
        "World not initialized"
      );
    }

    this.world.weather =
      weather;

    await World.findByIdAndUpdate(
      this.world.id,
      {
        weather,
      }
    );

    return this.getWorld();
  }

  /*
  | Set Time
  */

  async setTime(currentMinute) {
    if (!this.world) {
      throw new Error(
        "World not initialized"
      );
    }

    if (
      typeof currentMinute !==
        "number" ||
      currentMinute < 0 ||
      currentMinute >= 1440
    ) {
      throw new Error(
        "Invalid game time"
      );
    }

    this.world.currentMinute =
      currentMinute;

    this.lastUpdateTime =
      Date.now();

    await World.findByIdAndUpdate(
      this.world.id,
      {
        currentMinute,
      }
    );

    return this.getWorld();
  }

  /*
  | Set Time Scale
  */

  async setTimeScale(timeScale) {
    if (!this.world) {
      throw new Error(
        "World not initialized"
      );
    }

    if (
      typeof timeScale !==
        "number" ||
      timeScale <= 0
    ) {
      throw new Error(
        "Invalid time scale"
      );
    }

    /*
    | Reset timestamp trước khi
    | thay đổi tốc độ.
    */

    this.updateWorld();

    this.world.timeScale =
      timeScale;

    await World.findByIdAndUpdate(
      this.world.id,
      {
        timeScale,
      }
    );

    this.lastUpdateTime =
      Date.now();

    return this.getWorld();
  }

  /*
  | Moon
  */

  updateMoon() {
    /*
    | Đơn giản:
    | 8 ngày = 1 chu kỳ mặt trăng
    |
    | Có thể thay đổi sau.
    */

    const moonPhases = [
      "new",
      "waxing_crescent",
      "first_quarter",
      "waxing_gibbous",
      "full",
      "waning_gibbous",
      "last_quarter",
      "waning_crescent",
    ];

    const index =
      (this.world.day - 1) %
      moonPhases.length;

    const phase =
      moonPhases[index];

    this.world.moon.phase =
      phase;

    this.world.moon.isFullMoon =
      phase === "full";
  }

  /*
  | Stop
  */

  stop() {
    if (this.updateInterval) {
      clearInterval(
        this.updateInterval
      );

      this.updateInterval = null;

      console.log(
        "[World] World loop stopped"
      );
    }
  }
}

module.exports = WorldManager;
