"use strict";

require("dotenv").config();
const axios = require("axios");

const RAWG_BASE = "https://api.rawg.io/api";
const rawgKey = process.env.RAWG_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!rawgKey) {
  console.error("Missing RAWG_API_KEY in environment");
  process.exit(1);
}
if (!geminiKey) {
  console.error("Missing GEMINI_API_KEY in environment");
  process.exit(1);
}

async function fetchTopRatedGames(pageSize = 20) {
  const url = `${RAWG_BASE}/games`;
  const params = {
    key: rawgKey,
    ordering: "-rating",
    page_size: Math.min(pageSize, 40),
  };
  const r = await axios.get(url, { params });
  return r.data.results || [];
}

async function askGeminiForRecommendation(games) {
  // Build a concise prompt containing game names + short meta and ask Gemini for a ranked recommendation.
  const listing = games
    .map(
      (g, i) =>
        `${i + 1}. ${g.name} (released: ${g.released || "N/A"}, rating: ${
          g.rating || "N/A"
        })`
    )
    .join("\n");

  const prompt = `You are an assistant that recommends 5 games to a user. Given this list of games:\n${listing}\n\nFrom this list, pick and rank the top 5 games with a one-sentence reason each, focusing on overall rating and broad audience appeal.`;

  const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${geminiKey}`;
  const body = {
    prompt: { text: prompt },
    temperature: 0.3,
    maxOutputTokens: 512,
  };

  const r = await axios.post(url, body, {
    headers: { "Content-Type": "application/json" },
  });
  return r.data;
}

async function run() {
  try {
    const games = await fetchTopRatedGames(20);
    if (!games.length) {
      console.error("No games returned from RAWG");
      process.exit(1);
    }

    console.log(`Fetched ${games.length} top-rated games from RAWG`);
    const gResponse = await askGeminiForRecommendation(games.slice(0, 20));
    console.log("Gemini response:");
    console.log(JSON.stringify(gResponse, null, 2));
  } catch (err) {
    if (err.response) {
      console.error("API error:", err.response.status, err.response.data);
    } else {
      console.error("Request error:", err.message);
    }
    process.exit(1);
  }
}

if (require.main === module) run();
