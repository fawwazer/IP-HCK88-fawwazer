import React, { useEffect, useState } from "react";
import Card from "../components/card";
import RecomendGemini from "../components/recomendGemini";
import axios from "axios";

const API_URL = "https://game.fawwazerweb.site";

export default function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const pageSize = 40;
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const params = { page_size: pageSize, page };
    if (search) params.search = search;

    axios
      .get(`${API_URL}/games`, { params })
      .then((response) => {
        if (!mounted) return;
        setGames(
          response.data && response.data.results ? response.data.results : []
        );
      })
      .catch((err) => {
        console.error("Error fetching games:", err);
        if (!mounted) return;
        setError(err.response?.data?.error || err.message || String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Search Bar */}
      <div
        style={{
          padding: "20px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games..."
            style={{ flex: 1 }}
          />
          <button type="submit">🔍 Search</button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              style={{ background: "var(--text-secondary)" }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {loading && <div className="loading-text">⏳ Loading games...</div>}

      {error && <div className="error-text">❌ Error: {error}</div>}

      <RecomendGemini />

      <div className="games-grid">
        {games.map((game) => (
          <Card key={game.id} game={game} />
        ))}
      </div>

      {games.length === 0 && !loading && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-secondary)",
          }}
        >
          No games found. Try a different search term.
        </div>
      )}

      <div className="pagination">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          ← Previous
        </button>

        <div className="page-info">Page {page}</div>

        <button onClick={() => setPage((p) => p + 1)} disabled={loading}>
          Next →
        </button>
      </div>
    </div>
  );
}
