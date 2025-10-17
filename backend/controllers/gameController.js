"use strict";
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");
const { Genre, UserFavourite, Game, User } = require("../models");

class GameController {
  static async getAllGames(req, res, next) {
    try {
      //use api rawg to get all games
      const page = req.query.page || 1;
      const search = req.query.search || null;
      const response = await axios.get("https://api.rawg.io/api/games", {
        params: {
          key: process.env.RAWG_API_KEY,
          page: page,
          search: search,
        },
      });
      res.status(200).json(response.data);
    } catch (error) {
      console.log(error);

      next(error);
    }
  }

  static async listGenres(req, res, next) {
    try {
      const genres = await Genre.findAll();
      res.status(200).json(genres);
    } catch (error) {
      next(error);
    }
  }

  static async selectGameBasedOnGenre(req, res, next) {
    try {
      const genreId = req.params.genreId;
      const genre = await Genre.findByPk(genreId);
      if (!genre) {
        return res.status(404).json({ error: "Genre not found" });
      }
      const response = await axios.get(
        `https://api.rawg.io/api/games?genres=${genre.rawg_genre_id}&key=${process.env.RAWG_API_KEY}`
      );
      res.status(200).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  // get data from gemini ai api where user can ask for game recommendations based on their preferences
  static async getGameRecommendations(req, res, next) {
    try {
      // Accept genreId either as URL param or in body
      const genreId = req.params.genreId || req.body.genreId;
      if (!genreId) {
        return res.status(400).json({ error: "genreId is required" });
      }

      const genre = await Genre.findByPk(genreId);
      if (!genre) return res.status(404).json({ error: "Genre not found" });

      const rawgKey = process.env.RAWG_API_KEY;
      if (!rawgKey)
        return res.status(500).json({ error: "RAWG_API_KEY not configured" });

      // Fetch top games for the genre from RAWG
      const response = await axios.get("https://api.rawg.io/api/games", {
        params: {
          key: rawgKey,
          genres: genre.rawg_genre_id,
          page_size: 12,
          ordering: "-rating",
        },
      });

      const rawgGames = (response.data && response.data.results) || [];

      // If no Gemini key, return RAWG results with a note
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(200).json({
          note: "GEMINI_API_KEY not set, returning RAWG results",
          data: response.data,
        });
      }

      // Build a concise list for the prompt
      const candText = rawgGames
        .slice(0, 12)
        .map(
          (g, i) =>
            `${i + 1}. ${g.name} (rawg_id:${g.id}, released:${
              g.released || "N/A"
            }, rating:${g.rating || "N/A"})`
        )
        .join("\n");

      const preferences = req.body.preferences
        ? `User preferences: ${req.body.preferences}`
        : "";

      const prompt = `You are an assistant that recommends video games. ${preferences}\n\nGiven the following list of games (all are candidates):\n${candText}\n\nPlease select and rank the top ${
        req.body.top || 5
      } games from this list that best match the user's tastes. For each recommended game return an object with keys: name (string), rawg_id (number), reason (one short sentence, 8-20 words). Output ONLY valid JSON: an array of objects.`;

      // Call Gemini
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      let genRespText = null;
      try {
        const genResp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        genRespText =
          genResp && (genResp.text || genResp.outputText)
            ? genResp.text || genResp.outputText
            : JSON.stringify(genResp);
      } catch (err) {
        console.error(
          "Gemini call failed:",
          err && err.message ? err.message : err
        );
        return res.status(500).json({ error: "Gemini API error" });
      }

      // Try to parse JSON; if not directly JSON, extract JSON-like substring
      let recommendations = null;
      try {
        recommendations = JSON.parse(genRespText);
      } catch (e) {
        const m = genRespText && genRespText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (m) {
          try {
            recommendations = JSON.parse(m[0]);
          } catch (e2) {
            // ignore
          }
        }
      }

      if (!recommendations) {
        // return raw text if parsing failed
        return res
          .status(200)
          .json({ rawg: response.data, gemini_raw: genRespText });
      }

      // Normalize recommendations: ensure numbers for rawg_id
      const out = recommendations.map((r) => ({
        name: r.name,
        rawg_id: Number(r.rawg_id) || null,
        reason: r.reason || null,
      }));
      return res.status(200).json({ recommendations: out });
    } catch (error) {
      next(error);
    }
  }

  // POST /user/favourites  body: { user_id, game_id }
  static async addUserFavourite(req, res, next) {
    try {
      // Accept either an existing game_id (DB) or a rawg_id (from RAWG API)
      const { user_id: body_user_id, game_id, rawg_id } = req.body || {};
      // If auth is used, prefer authenticated user
      const userId = (req.user && req.user.id) || body_user_id;
      if (!userId || (!game_id && !rawg_id))
        return res
          .status(400)
          .json({ error: "user_id and either game_id or rawg_id required" });

      // Validate user exists
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Resolve or create the Game record
      let dbGame = null;

      if (game_id) {
        dbGame = await Game.findByPk(game_id);
        if (!dbGame) return res.status(404).json({ error: "Game not found" });
      } else {
        // rawg_id path: fetch minimal data from RAWG and insert into Game table
        const rawgKey = process.env.RAWG_API_KEY;
        if (!rawgKey)
          return res.status(500).json({ error: "RAWG_API_KEY not configured" });

        // Fetch from RAWG by id
        let rawgResp;
        try {
          rawgResp = await axios.get(
            `https://api.rawg.io/api/games/${rawg_id}`,
            {
              params: { key: rawgKey },
            }
          );
        } catch (err) {
          return res
            .status(404)
            .json({ error: `RAWG game ${rawg_id} not found` });
        }

        const g = rawgResp && rawgResp.data ? rawgResp.data : null;
        if (!g)
          return res
            .status(500)
            .json({ error: "Failed to fetch game details from RAWG" });

        // Trimmed fields we store in the Game model
        const trimmed = {
          rawg_id: Number(g.id) || null,
          name: g.name || "",
          imageUrl: g.background_image || g.background_image_additional || null,
          released: g.released || null,
        };

        // Upsert behavior: try to find existing by rawg_id, otherwise create
        dbGame = await Game.findOne({ where: { rawg_id: trimmed.rawg_id } });
        if (!dbGame) {
          dbGame = await Game.create(trimmed);
        } else {
          // Optionally update missing fields
          const needsUpdate =
            !dbGame.imageUrl && trimmed.imageUrl
              ? { imageUrl: trimmed.imageUrl }
              : null;
          if (needsUpdate) await dbGame.update(needsUpdate);
        }
      }

      // Create the UserFavourite pointing to the resolved dbGame.id
      const fav = await UserFavourite.create({
        user_id: Number(userId),
        game_id: Number(dbGame.id),
      });

      return res.status(201).json({
        id: fav.id,
        user_id: fav.user_id,
        game_id: fav.game_id,
        game: {
          id: dbGame.id,
          rawg_id: dbGame.rawg_id,
          name: dbGame.name,
          imageUrl: dbGame.imageUrl,
          released: dbGame.released,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /user/favourites?user_id=123  OR GET /user/:userId/favourites
  static async listUserFavourites(req, res, next) {
    try {
      const userId =
        (req.user && req.user.id) || req.query.user_id || req.params.userId;
      if (!userId) return res.status(400).json({ error: "user id required" });
      const favs = await UserFavourite.findAll({
        where: { user_id: Number(userId) },
        include: [{ model: Game, as: "game" }],
      });
      const out = (favs || []).map((f) => ({
        id: f.id,
        user_id: f.user_id,
        game_id: f.game_id,
        game: f.game
          ? {
              id: f.game.id,
              name: f.game.name,
              released: f.game.released,
              // expose a consistent imageUrl property (use stored imageUrl if present,
              // otherwise fall back to other common fields)
              imageUrl:
                f.game.imageUrl ||
                f.game.background_image ||
                f.game.image_url ||
                null,
              rating: f.game.rating,
            }
          : null,
      }));
      return res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /user/favourites/:gameId  (accepts user_id in body or query)
  static async removeUserFavourite(req, res, next) {
    try {
      const routeGameId = req.params.gameId;
      // Prefer authenticated user id (if auth middleware set req.user), fall back to body/query
      const userId =
        (req.user && req.user.id) || req.body.user_id || req.query.user_id;
      if (!userId) return res.status(400).json({ error: "user_id required" });
      if (!routeGameId)
        return res.status(400).json({ error: "gameId required in URL" });

      // Try to find the favourite by game_id (DB id) AND user_id
      const fav = await UserFavourite.findOne({
        where: { user_id: Number(userId), game_id: Number(routeGameId) },
      });
      if (!fav) return res.status(404).json({ error: "Favourite not found" });

      await fav.destroy();
      return res
        .status(200)
        .json({ id: fav.id, user_id: fav.user_id, game_id: fav.game_id });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = GameController;
