"use strict";
const { GoogleGenAI } = require("@google/genai");

require("dotenv").config();
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in environment");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const axios = require("axios");
const RAWG_BASE = "https://api.rawg.io/api";
const rawgKey = process.env.RAWG_API_KEY;

async function fetchTopGames(limit = 20) {
  if (!rawgKey) {
    console.error("Missing RAWG_API_KEY in environment");
    return [];
  }
  try {
    const r = await axios.get(`${RAWG_BASE}/games`, {
      params: {
        key: rawgKey,
        ordering: "-rating",
        page_size: Math.min(limit, 40),
      },
    });
    return r.data.results || [];
  } catch (err) {
    console.error("RAWG fetch error:", err && err.message ? err.message : err);
    return [];
  }
}

async function testGemini(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // response shape may vary; try common fields
    if (!response) return null;
    if (response.text) return response.text;
    if (response.outputText) return response.outputText;
    // fallback: return JSON
    return JSON.stringify(response, null, 2);
  } catch (err) {
    console.error(
      "Error calling Gemini API:",
      err && err.message ? err.message : err
    );
    return null;
  }
}

(async () => {
  // Fetch top games from RAWG and ask Gemini to recommend 5
  const games = await fetchTopGames(20);
  if (!games.length) {
    console.error(
      "No games fetched from RAWG, aborting Gemini recommendation."
    );
    return;
  }

  const list = games
    .slice(0, 20)
    .map(
      (g, i) =>
        `${i + 1}. ${g.name} (released: ${g.released || "N/A"}, rating: ${
          g.rating || "N/A"
        })`
    )
    .join("\n");

  const prompt = `You are an assistant that recommends games. From the following list of games:\n${list}\n\nPlease recommend and rank the top 5 games for a broad audience, giving one short sentence (10-20 words) explaining why for each recommendation. Output the result as a numbered list.`;

  const out = await testGemini(prompt);
  console.log("Gemini recommendation output:\n", out);
})();
