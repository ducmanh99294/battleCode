export default function CodeEditor({ code, setCode }) {
  return (
    <div>
      <h3>Code</h3>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        style={{ width: "100%" }}
      />
    </div>
  );
}