import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext"

import PlayerPanel from "../components/battleCode/PlayerPanel";
import EnemyPanel from "../components/battleCode/EnemyPanel";
import CodeEditor from "../components/battleCode/CodeEditor";
import LogPanel from "../components/battleCode/LogPanel";

// const socket = io("http://localhost:3000");

export default function GamePage() {
  const {socket} = useSocket();  

  const [dungeon, setDungeon] = useState(null);
  const [code, setCode] = useState(`def action(state):
    return {"type": "attack", "target": "e1"}`);

  useEffect(() => {
    if (!socket) return; 

    socket.on("dungeon_update", (data) => {
      setDungeon(data);
    });

    return () => socket.off("dungeon_update");
  }, [socket]);

  const runCode = () => {
    if (!socket) return; 

    socket.emit("player_action", {
      dungeonId: "test",
      code
    });
  };

  if (!dungeon) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex", padding: 20, gap: 20 }}>
      
      {/* LEFT */}
      <div style={{ flex: 1 }}>
        <PlayerPanel players={dungeon.players} />
        <EnemyPanel enemies={dungeon.enemies} />
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1 }}>
        <CodeEditor code={code} setCode={setCode} />
        <button onClick={runCode}>Run Code</button>
        <LogPanel logs={dungeon.logs} />
      </div>

    </div>
  );
}