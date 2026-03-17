const { v4: uuidv4 } = require("uuid");

const queue = global.queue || (global.queue = []);
const dungeons = global.dungeons || (global.dungeons = {});

const MAX_PLAYERS = 2;

exports.joinQueue = (socket) => {
  const userId = socket.userId;

  if (queue.find(p => p.userId === userId)) return;

  queue.push({ userId, socket });

  if (queue.length >= MAX_PLAYERS) {
    const players = queue.splice(0, MAX_PLAYERS);

    const dungeonId = uuidv4();

    const dungeon = {
      id: dungeonId,
      stage: 1,
      players: players.map(p => ({
        userId: p.userId,
        hp: 100,
        mana: 50
      })),
      enemies: generateEnemies(1),
      logs: ["🔥 Battle started"],
      currentTurn: players[0].userId
    };

    dungeons[dungeonId] = dungeon;

    // join room
    players.forEach(p => {
      p.socket.join(dungeonId);
    });

    return {
      dungeonId,
      dungeon,
      players
    };
  }

  return null;
};

exports.leaveQueue = (socket) => {
  const index = queue.findIndex(p => p.userId === socket.userId);
  if (index !== -1) queue.splice(index, 1);
};

function generateEnemies(stage) {
  return [
    { id: "e1", hp: 80 + stage * 10, attack: 10 },
    { id: "e2", hp: 80 + stage * 10, attack: 10 }
  ];
}