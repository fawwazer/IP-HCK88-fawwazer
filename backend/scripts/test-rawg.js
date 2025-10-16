"use strict";

require("dotenv").config();
const axios = require("axios");

const RAWG_BASE = "https://api.rawg.io/api";

async function getPlatforms(apiKey) {
  const url = `${RAWG_BASE}/platforms`;
  const r = await axios.get(url, { params: { key: apiKey, page_size: 50 } });
  return r.data.results;
}

async function getGames(apiKey, dates, platforms) {
  const url = `${RAWG_BASE}/games`;
  const params = { key: apiKey, page_size: 50 };
  if (dates) params.dates = dates;
  if (platforms) params.platforms = platforms;
  const r = await axios.get(url, { params });
  return r.data.results;
}

async function run() {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("Missing RAWG_API_KEY in environment");
    process.exit(1);
  }

  try {
    console.log("Fetching platforms...");
    const platforms = await getPlatforms(apiKey);
    console.log(`Platforms returned: ${platforms.length}`);
    console.log(
      platforms.map((p) => ({ id: p.id, name: p.name })).slice(0, 10)
    );

    // Default example from your message
    const dates = "2025-09-01,2025-09-30";
    const platformsFilter = "18,1,7";

    console.log(
      `\nFetching games for dates=${dates} platforms=${platformsFilter} ...`
    );
    const games = await getGames(apiKey, dates, platformsFilter);
    console.log(`Games returned: ${games.length}`);
    console.log(
      games
        .map((g) => ({
          id: g.id,
          name: g.name,
          released: g.released,
          image: g.background_image,
        }))
        .slice(0, 10)
    );
  } catch (err) {
    if (err.response) {
      console.error("RAWG error:", err.response.status, err.response.data);
    } else {
      console.error("Request error:", err.message);
    }
    process.exit(1);
  }
}

if (require.main === module) run();
