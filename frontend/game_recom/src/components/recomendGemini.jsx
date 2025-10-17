import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://game.fawwazerweb.site";

export default function RecomendGemini() {
  const [genres, setGenres] = useState([]);
  const [genreId, setGenreId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${API_URL}/genres`)
      .then((r) => {
        if (!mounted) return;
        setGenres(r.data || []);
        if ((r.data || []).length > 0) setGenreId(r.data[0].id);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load genres:", err);
        setError("Failed to load genres");
      });
    return () => (mounted = false);
  }, []);

  async function fetchRecommendations() {
    if (!genreId) return;

    try {
      setLoading(true);
      setError(null);
      setRecs([]);

      const resp = await axios.post(
        `${API_URL}/games/recommendations/${genreId}`,
        { top: 5 }
      );

      const data = resp.data || {};
      const items =
        data.recommendations || data.results || data.data?.results || [];

      // Normalize items to { name, rawg_id, reason }
      const normalized = (Array.isArray(items) ? items : [])
        .slice(0, 5)
        .map((it) => ({
          name: it.name || it.title || "Unknown",
          rawg_id: it.rawg_id || it.id || null,
          reason:
            it.reason ||
            it.excerpt ||
            it.description?.substring(0, 100) ||
            null,
        }));

      setRecs(normalized);
    } catch (err) {
      console.error("Recommendation error:", err);
      setError(
        err.response?.data?.error || err.message || "Recommendation failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gemini-panel">
      <h4>🎮 AI Game Recommendations (Powered by Gemini)</h4>

      <div className="gemini-controls">
        <label>Select Genre:</label>
        <select
          value={genreId != null ? String(genreId) : ""}
          onChange={(e) => setGenreId(Number(e.target.value))}
        >
          {genres.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.name}
            </option>
          ))}
        </select>
        <button onClick={fetchRecommendations} disabled={loading || !genreId}>
          {loading ? "🔄 Loading..." : "✨ Get Recommendations"}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {recs.length === 0 && !error && !loading && (
        <div
          style={{
            color: "var(--text-secondary)",
            textAlign: "center",
            padding: "20px",
          }}
        >
          No recommendations yet. Choose a genre and click Get Recommendations.
        </div>
      )}

      {recs.length > 0 && (
        <ol className="recommendation-list">
          {recs.map((r, i) => (
            <li key={i} className="recommendation-item">
              <div className="recommendation-name">{r.name}</div>
              {r.reason && (
                <div className="recommendation-reason">{r.reason}</div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
