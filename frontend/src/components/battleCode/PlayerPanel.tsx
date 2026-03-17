export default function PlayerPanel({ players }) {
  return (
    <div>
      <h2>Players</h2>
      {players.map(p => (
        <div key={p.id}>
          <b>{p.name}</b> - HP: {p.hp}
        </div>
      ))}
    </div>
  );
}