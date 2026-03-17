const Match = require("../models/Match");

exports.saveMatch = async (dungeon) => {
  try {
    await Match.create({
      players: dungeon.players.map(p => p.userId),
      status: "finished",
      logs: dungeon.logs,
      winner: dungeon.winner || null
    });
  } catch (err) {
    console.error("Save match error:", err.message);
  }
};