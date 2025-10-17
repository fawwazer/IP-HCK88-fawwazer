import { useState } from "react";
import axios from "axios";

export default function Card({ game, onFavoriteToggle }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const img = game.background_image || "/placeholder-game.png";

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please login to add favorites");
        return;
      }

      if (isFavorite) {
        // Remove from favorites
        await axios.delete(
          `https://game.fawwazerweb.site/user/favourites/${game.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsFavorite(false);
      } else {
        // Add to favorites
        await axios.post(
          "https://game.fawwazerweb.site/user/favourites",
          { rawg_id: game.id },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsFavorite(true);
      }

      if (onFavoriteToggle) onFavoriteToggle();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert(error.response?.data?.error || "Failed to update favorite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <img src={img} alt={game.name} />
      <div className="card-content">
        <h3 className="card-title">{game.name}</h3>
        <div className="card-meta">
          <span>{game.released || "N/A"}</span>
          <span className="card-rating">★ {game.rating || "N/A"}</span>
        </div>
        <p className="card-description">
          {game.description_raw?.substring(0, 120) ||
            game.description ||
            "No description available"}
        </p>
        <button
          onClick={handleFavoriteClick}
          disabled={loading}
          style={{
            marginTop: "auto",
            background: isFavorite ? "#d9534f" : "#66c0f4",
          }}
        >
          {loading ? "..." : isFavorite ? "❤️ Remove" : "🤍 Add to Favorites"}
        </button>
      </div>
    </div>
  );
}
