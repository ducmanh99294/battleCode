function initTurn(dungeon) {
  dungeon.turn = 0;
  dungeon.turnOrder = [];

  // player trước
  dungeon.players.forEach(p => {
    dungeon.turnOrder.push({
      type: "player",
      id: p.id
    });
  });

  // enemy sau
  dungeon.enemies.forEach(e => {
    dungeon.turnOrder.push({
      type: "enemy",
      id: e.id
    });
  });
}

function getCurrentTurn(dungeon) {
  return dungeon.turnOrder[dungeon.turn % dungeon.turnOrder.length];
}

function nextTurn(dungeon) {
  dungeon.turn++;
}

module.exports = {
  initTurn,
  getCurrentTurn,
  nextTurn
};