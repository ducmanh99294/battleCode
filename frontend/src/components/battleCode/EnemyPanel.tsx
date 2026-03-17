export default function EnemyPanel({ enemies }) {
  return (
    <div>
      <h2>Enemies</h2>
      {enemies.map(e => (
        <div key={e.id}>
          <b>{e.name}</b> - HP: {e.hp}
        </div>
      ))}
    </div>
  );
}