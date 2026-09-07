const SpawnPoint = require("../models/SpawnPoint");

let spawnManagerRef = null;
const setSpawnManager = (manager) => { spawnManagerRef = manager; };

exports.getSpawnPoints = async (req, res) => {
  const points = await SpawnPoint.find().lean();
  return res.json({ success: true, spawnPoints: points });
};

exports.createSpawnPoint = async (req, res) => {
  try {
    const point = await SpawnPoint.create(req.body);
    await spawnManagerRef?.reload();
    return res.status(201).json({ success: true, spawnPoint: point });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateSpawnPoint = async (req, res) => {
  try {
    const point = await SpawnPoint.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!point) return res.status(404).json({ success: false, message: "Not found" });
    await spawnManagerRef?.reload();
    return res.json({ success: true, spawnPoint: point });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteSpawnPoint = async (req, res) => {
  const point = await SpawnPoint.findByIdAndDelete(req.params.id);
  if (!point) return res.status(404).json({ success: false, message: "Not found" });
  await spawnManagerRef?.reload();
  return res.json({ success: true });
};

exports.setSpawnManager = setSpawnManager;