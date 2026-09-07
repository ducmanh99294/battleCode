const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTllNzhmZGZkYTBiNDI3ZDM0ZDQ2ZmIiLCJ1c2VybmFtZSI6ImJpZ3R3aWNoIiwiaWF0IjoxNzg4NzcwNTc0LCJleHAiOjE3ODkzNzUzNzR9.QD0yXgIGx17I8NuP4KExqTtd-qGIeiN8_uTAOg6y-nY",
 }, // token vừa login
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("join_world", { scene: "MainWorld", x: 0, y: 0 }, (res) => {
    console.log("join_world response:", res);
  });
});

socket.on("world_state", (data) => console.log("world_state:", data));
socket.on("zone_players", (data) => console.log("zone_players:", data));
socket.on("zone_monsters", (data) => console.log("zone_monsters:", data));

setTimeout(() => {
  socket.emit("player_move", { x: 99, y: 88 });
  setTimeout(() => {
    socket.emit("save_player", {}, (res) => {
      console.log("save_player after move:", res);
      socket.disconnect();
    });
  }, 500);
}, 1000);

setTimeout(() => {
  socket.emit("save_player", {}, (res) => {
    console.log("save_player response:", res);
  });
}, 2000);

socket.on("connect_error", (err) => console.error("Connect error:", err.message));