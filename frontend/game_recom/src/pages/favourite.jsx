import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://game.fawwazerweb.site";

export default function Favourite() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavourites();
  }, []);

  const fetchFavourites = async () => {
    setLoading(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) {
        setError("Please login to view favourites");
        return;
      }

      const { data } = await axios.get(`${API_URL}/user/favourites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFavourites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching favourites:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to load favourites"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (gameId) => {
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      await axios.delete(`${API_URL}/user/favourites/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFavourites(favourites.filter((fav) => fav.game_id !== gameId));
    } catch (err) {
      console.error("Error removing favourite:", err);
      alert(err.response?.data?.error || "Failed to remove favourite");
    }
  };

  if (loading) {
    return <div className="loading-text">⏳ Loading your favourites...</div>;
  }

  if (error) {
    return <div className="error-text">❌ {error}</div>;
  }

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: "var(--bg-card)",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <h1
          style={{
            color: "var(--accent-blue)",
            marginBottom: "20px",
            fontSize: "32px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          ❤️ My Favourite Games
        </h1>

        {favourites.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--text-secondary)",
            }}
          >
            <h3 style={{ marginBottom: "12px" }}>No favourites yet</h3>
            <p>Start adding games to your favourites from the home page!</p>
          </div>
        ) : (
          <div className="games-grid">
            {favourites.map((fav) => {
              const game = fav.game || {};
              return (
                <div key={fav.id} className="card">
                  <img
                    src={
                      game.imageUrl ||
                      game.background_image ||
                      "/placeholder-game.png"
                    }
                    alt={game.name}
                  />
                  <div className="card-content">
                    <h3 className="card-title">
                      {game.name || "Unknown Game"}
                    </h3>
                    <div className="card-meta">
                      <span>{game.released || "N/A"}</span>
                      <span className="card-rating">
                        ★ {game.rating || "N/A"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(fav.game_id)}
                      style={{
                        marginTop: "auto",
                        background: "var(--danger)",
                      }}
                    >
                      ❌ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
