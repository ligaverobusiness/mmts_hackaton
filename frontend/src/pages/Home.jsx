export default function Home() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <h1>Home</h1>
      <p>Frontend OK (React + Vite)</p>

      <hr style={{ margin: "16px 0" }} />

      <h2>Pruebas</h2>
      <ul>
        <li>
          Backend Node: <code>/api/health</code>
        </li>
        <li>
          Backend Python: <code>/py/health</code>
        </li>
      </ul>
    </div>
  );
}
