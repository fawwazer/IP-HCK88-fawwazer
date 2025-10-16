import React, { useEffect, useState } from "react";
import Card from "../components/card";
import RecomendGemini from "../components/recomendGemini";
import axios from "axios";

export default function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageSize = 40;
  const [page, setPage] = useState(1); // 1..10

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    axios
      .get("http://localhost:3000/games", {
        params: { page_size: pageSize, page },
      })
      .then((response) => {
        if (!mounted) return;
        setGames(
          response.data && response.data.results ? response.data.results : []
        );
      })
      .catch((err) => {
        console.error("Error fetching games:", err);
        if (!mounted) return;
        setError(err.message || String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [page]);

  return (
    <>
      <div style={{ padding: 16 }}>
        {loading && (
          <div style={{ textAlign: "center", marginBottom: 8 }}>Loading...</div>
        )}
        {error && (
          <div
            style={{ textAlign: "center", color: "crimson", marginBottom: 8 }}
          >
            Error: {error}. Is the backend running?
          </div>
        )}

        <RecomendGemini />

        <div
          className="games-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {games.map((game) => (
            <Card key={game.id} game={game} />
          ))}
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Previous
        </button>

        <div style={{ alignSelf: "center" }}>Page {page}</div>

        <button
          onClick={() => setPage((p) => Math.min(10, p + 1))}
          disabled={page >= 10 || loading}
        >
          Next
        </button>
      </div>
    </>
  );
}
