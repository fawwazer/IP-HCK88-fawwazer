"use strict";

require("dotenv").config();
const axios = require("axios");

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";

async function getTwitchToken(clientId, clientSecret) {
  const resp = await axios.post(TWITCH_TOKEN_URL, null, {
    params: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    },
  });
  return resp.data.access_token;
}

async function testGamesEndpoint() {
  const clientId = process.env.IGDB_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
  const clientSecret =
    process.env.IGDB_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      "Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET in environment"
    );
    process.exit(1);
  }

  try {
    const token = await getTwitchToken(clientId, clientSecret);
    console.log("Got token (truncated):", token.substring(0, 20) + "...");

    const query = "fields id,name,cover.image_id; limit 5;";
    const r = await axios.post(IGDB_GAMES_URL, query, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("IGDB /games response:");
    console.dir(r.data, { depth: null });
  } catch (err) {
    if (err.response) {
      console.error("IGDB error:", err.response.status, err.response.data);
    } else {
      console.error("Request error:", err.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  testGamesEndpoint();
}
