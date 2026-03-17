export default function LogPanel({ logs }) {
  return (
    <div>
      <h3>Logs</h3>
      <div style={{ maxHeight: 200, overflow: "auto" }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}