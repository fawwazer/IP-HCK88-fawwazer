export default function Card({ game }) {
  const img = game.background_image || "/placeholder-game.png";
  return (
    <div
      className="card"
      style={{
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <img
        src={img}
        alt={game.name}
        style={{
          width: "100%",
          height: 140,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div style={{ padding: 12 }}>
        <h4 style={{ margin: "0 0 6px 0" }}>{game.name}</h4>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          {game.released || "N/A"} • ★ {game.rating || "N/A"}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#333" }}>
          {game.description || ""}
        </p>
      </div>
    </div>
  );
}
