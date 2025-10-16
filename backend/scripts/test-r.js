const axios = require("axios");

class RAWGAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = "https://api.rawg.io/api";
  }

  // Method untuk mendapatkan games
  async getGames(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/games`, {
        params: {
          key: this.apiKey,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching games:", error.message);
      throw error;
    }
  }

  // Method untuk mendapatkan detail game
  async getGameDetails(gameId) {
    try {
      const response = await axios.get(`${this.baseURL}/games/${gameId}`, {
        params: {
          key: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching game details:", error.message);
      throw error;
    }
  }

  // Method untuk mencari games
  async searchGames(query, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/games`, {
        params: {
          key: this.apiKey,
          search: query,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching games:", error.message);
      throw error;
    }
  }
}

// Contoh penggunaan
async function main() {
  const apiKey = "API_KEY_ANDA"; // Dapatkan dari https://rawg.io/apidocs
  const rawg = new RAWGAPI(apiKey);

  try {
    // Mendapatkan games populer
    const popularGames = await rawg.getGames({
      page_size: 10,
      ordering: "-rating",
    });
    console.log("Popular Games:", popularGames.results);

    // Mencari game
    const searchedGames = await rawg.searchGames("call of duty", {
      page_size: 5,
    });
    console.log("Search Results:", searchedGames.results);

    // Mendapatkan detail game
    const gameDetails = await rawg.getGameDetails(3498); // GTA V
    console.log("Game Details:", gameDetails);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
