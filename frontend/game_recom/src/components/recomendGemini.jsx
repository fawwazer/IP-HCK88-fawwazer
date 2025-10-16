import React, { useEffect, useState } from "react";
import axios from "axios";

export default function RecomendGemini() {
  const [genres, setGenres] = useState([]);
  const [genreId, setGenreId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    let mounted = true;
    axios
      .get("http://localhost:3000/genres")
      .then((r) => {
        if (!mounted) return;
        setGenres(r.data || []);
        if ((r.data || []).length > 0) setGenreId(r.data[0].id);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Failed to load genres");
      });
    return () => (mounted = false);
  }, []);

  async function fetchRecommendations() {
    try {
      setLoading(true);
      setError(null);
      setRecs([]);
      const url = genreId
        ? `http://localhost:3000/games/recommendations/${genreId}`
        : `http://localhost:3000/games/recommendations`;
      const resp = await axios.post(url, { top: 5 });
      // the backend may return { recommendations: [...] } or { results: [...] }
      const data = resp.data || {};
      const items = data.recommendations || data.results || data.rawg || [];
      // normalize items to { name, rawg_id, reason }
      const normalized = (items || []).slice(0, 5).map((it) => {
        if (it && it.name)
          return {
            name: it.name,
            rawg_id: it.rawg_id || it.id || null,
            reason: it.reason || it.excerpt || null,
          };
        // fallback if backend returned rawg objects
        return {
          name: it.name || it.title || "Unknown",
          rawg_id: it.id || null,
          reason: it.description || null,
        };
      });
      setRecs(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message || "Recommendation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: 14 }}>Genre:</label>
        <select
          value={genreId != null ? String(genreId) : ""}
          onChange={(e) => setGenreId(Number(e.target.value))}
          style={{ cursor: "pointer" }}
        >
          {genres.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.name}
            </option>
          ))}
        </select>
        <button onClick={fetchRecommendations} disabled={loading || !genreId}>
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>
      )}

      <div
        style={{
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 6,
          background: "#fff",
        }}
      >
        <h4 style={{ marginTop: 0 }}>Gemini Recommendations</h4>
        {recs.length === 0 && (
          <div style={{ color: "#666" }}>
            No recommendations yet. Choose a genre and click Get
            Recommendations.
          </div>
        )}
        <ol>
          {recs.map((r, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              {r.reason && (
                <div style={{ color: "#555", fontSize: 13 }}>{r.reason}</div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
