const dungeons = global.dungeons || (global.dungeons = {});

exports.getDungeon = (dungeonId) => {
  return dungeons[dungeonId];
};

exports.leaveDungeon = (socket, dungeonId) => {
  const dungeon = dungeons[dungeonId];
  if (!dungeon) return null;

  dungeon.players = dungeon.players.filter(
    p => p.userId !== socket.userId
  );

  if (dungeon.players.length === 0) {
    delete dungeons[dungeonId];
  }

  return dungeon;
};