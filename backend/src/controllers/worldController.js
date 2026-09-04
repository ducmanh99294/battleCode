const World = require("../models/World");

/*
| WorldManager Instance
|
| index.js sẽ inject WorldManager vào controller.
|
*/

let worldManager = null;

const setWorldManager = (manager) => {
  worldManager = manager;
};


/*
| GET WORLD
| GET /world
*/

const getWorld = async (req, res) => {
  try {
    if (!worldManager) {
      return res.status(503).json({
        success: false,
        message: "World server is not ready",
      });
    }

    const world = worldManager.getWorld();

    if (!world) {
      return res.status(404).json({
        success: false,
        message: "World not found",
      });
    }

    return res.status(200).json({
      success: true,
      world,
    });
  } catch (error) {
    console.error(
      "getWorld error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
| UPDATE WEATHER
| PUT /world/weather
|
| {
|   "weather": "rain"
| }
*/

const updateWeather = async (req, res) => {
  try {
    if (!worldManager) {
      return res.status(503).json({
        success: false,
        message: "World server is not ready",
      });
    }

    const { weather } = req.body;

    if (!weather) {
      return res.status(400).json({
        success: false,
        message: "Weather is required",
      });
    }

    const world =
      await worldManager.setWeather(weather);

    return res.status(200).json({
      success: true,
      message: "Weather updated",
      world,
    });
  } catch (error) {
    console.error(
      "updateWeather error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


/*
| UPDATE TIME
| PUT /world/time
|
| {
|   "timeOfDay": 18
| }
*/

const updateTime = async (req, res) => {
  try {
    if (!worldManager) {
      return res.status(503).json({
        success: false,
        message: "World server is not ready",
      });
    }

    const { timeOfDay } = req.body;

    if (typeof timeOfDay !== "number") {
      return res.status(400).json({
        success: false,
        message: "timeOfDay must be a number",
      });
    }

    const world =
      await worldManager.setTime(
        timeOfDay
      );

    return res.status(200).json({
      success: true,
      message: "World time updated",
      world,
    });
  } catch (error) {
    console.error(
      "updateTime error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



/*
| EXPORT
*/

module.exports = {
  setWorldManager,
  getWorld,
  updateWeather,
  updateTime,
};