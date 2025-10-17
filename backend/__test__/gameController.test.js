const request = require("supertest");
const express = require("express");
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");

// Mock axios and GoogleGenAI
jest.mock("axios");
jest.mock("@google/genai");

// Mock models
jest.mock("../models", () => ({
  Genre: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  Game: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  UserFavourite: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe("GameController", () => {
  let app;
  let Genre, Game, User, UserFavourite;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Import mocked modules
    const models = require("../models");
    Genre = models.Genre;
    Game = models.Game;
    User = models.User;
    UserFavourite = models.UserFavourite;

    // Set env variables
    process.env.RAWG_API_KEY = "test-rawg-key";
    process.env.GEMINI_API_KEY = "test-gemini-key";

    // Setup routes
    const GameController = require("../controllers/gameController");
    app.get("/games", GameController.getAllGames);
    app.get("/genres", GameController.listGenres);
    app.get("/genres/:genreId/games", GameController.selectGameBasedOnGenre);
    app.post(
      "/games/recommendations/:genreId",
      GameController.getGameRecommendations
    );
    app.post("/user/favourites", GameController.addUserFavourite);
    app.get("/user/favourites", GameController.listUserFavourites);
    app.delete("/user/favourites/:gameId", GameController.removeUserFavourite);

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /games", () => {
    test("should fetch games from RAWG API", async () => {
      axios.get.mockResolvedValue({
        data: {
          results: [{ id: 1, name: "Game 1" }],
          count: 100,
        },
      });

      const res = await request(app).get("/games?page=1");

      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBeDefined();
      expect(axios.get).toHaveBeenCalledWith(
        "https://api.rawg.io/api/games",
        expect.objectContaining({
          params: expect.objectContaining({
            key: "test-rawg-key",
            page: "1",
          }),
        })
      );
    });

    test("should fetch games with search parameter", async () => {
      axios.get.mockResolvedValue({
        data: { results: [{ id: 1, name: "Witcher" }] },
      });

      const res = await request(app).get("/games?search=witcher");

      expect(res.statusCode).toBe(200);
      expect(axios.get).toHaveBeenCalledWith(
        "https://api.rawg.io/api/games",
        expect.objectContaining({
          params: expect.objectContaining({
            search: "witcher",
          }),
        })
      );
    });

    test("should handle RAWG API errors", async () => {
      axios.get.mockRejectedValue(new Error("RAWG API Error"));

      const res = await request(app).get("/games");

      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /genres", () => {
    test("should list all genres", async () => {
      Genre.findAll.mockResolvedValue([
        { id: 1, name: "Action" },
        { id: 2, name: "RPG" },
      ]);

      const res = await request(app).get("/genres");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(Genre.findAll).toHaveBeenCalled();
    });

    test("should handle database errors", async () => {
      Genre.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/genres");

      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /genres/:genreId/games", () => {
    test("should fetch games by genre", async () => {
      Genre.findByPk.mockResolvedValue({
        id: 1,
        name: "Action",
        rawg_genre_id: 4,
      });

      axios.get.mockResolvedValue({
        data: { results: [{ id: 1, name: "Action Game" }] },
      });

      const res = await request(app).get("/genres/1/games");

      expect(res.statusCode).toBe(200);
      expect(Genre.findByPk).toHaveBeenCalledWith("1");
      expect(axios.get).toHaveBeenCalled();
    });

    test("should return 404 if genre not found", async () => {
      Genre.findByPk.mockResolvedValue(null);

      const res = await request(app).get("/genres/999/games");

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain("Genre not found");
    });
  });

  describe("POST /games/recommendations/:genreId", () => {
    test("should return 400 if genreId missing", async () => {
      const res = await request(app).post("/games/recommendations/");

      expect(res.statusCode).toBe(404); // Route not found
    });

    test("should return 404 if genre not found", async () => {
      Genre.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post("/games/recommendations/999")
        .send({});

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain("Genre not found");
    });

    test("should return RAWG results when GEMINI_API_KEY not set", async () => {
      delete process.env.GEMINI_API_KEY;

      Genre.findByPk.mockResolvedValue({
        id: 1,
        name: "Action",
        rawg_genre_id: 4,
      });

      axios.get.mockResolvedValue({
        data: { results: [{ id: 1, name: "Game 1", rating: 4.5 }] },
      });

      const res = await request(app).post("/games/recommendations/1").send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.note).toContain("GEMINI_API_KEY not set");
      expect(res.body.data).toBeDefined();

      // Restore env
      process.env.GEMINI_API_KEY = "test-gemini-key";
    });

    test("should handle Gemini API call and parse JSON response", async () => {
      Genre.findByPk.mockResolvedValue({
        id: 1,
        name: "Action",
        rawg_genre_id: 4,
      });

      axios.get.mockResolvedValue({
        data: {
          results: [
            { id: 123, name: "Game A", rating: 4.5, released: "2023-01-01" },
          ],
        },
      });

      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify([
          { name: "Game A", rawg_id: 123, reason: "Great action game" },
        ]),
      });

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const res = await request(app)
        .post("/games/recommendations/1")
        .send({ preferences: "I like fast-paced games", top: 3 });

      expect(res.statusCode).toBe(200);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.recommendations).toHaveLength(1);
      expect(res.body.recommendations[0].name).toBe("Game A");
      expect(res.body.recommendations[0].rawg_id).toBe(123);
    });

    test("should handle Gemini API response with JSON extraction", async () => {
      Genre.findByPk.mockResolvedValue({
        id: 1,
        name: "RPG",
        rawg_genre_id: 5,
      });

      axios.get.mockResolvedValue({
        data: {
          results: [{ id: 456, name: "RPG Game", rating: 4.8 }],
        },
      });

      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'Here are the recommendations:\n[{"name":"RPG Game","rawg_id":456,"reason":"Amazing story"}]\nEnjoy!',
      });

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const res = await request(app).post("/games/recommendations/1").send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.recommendations[0].rawg_id).toBe(456);
    });

    test("should return raw text if JSON parsing fails", async () => {
      Genre.findByPk.mockResolvedValue({
        id: 1,
        name: "Strategy",
        rawg_genre_id: 10,
      });

      axios.get.mockResolvedValue({
        data: { results: [{ id: 789, name: "Strategy Game" }] },
      });

      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: "This is not valid JSON text",
      });

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const res = await request(app).post("/games/recommendations/1").send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.gemini_raw).toBeDefined();
      expect(res.body.rawg).toBeDefined();
    });

    test("should handle Gemini API errors", async () => {
      Genre.findByPk.mockResolvedValue({
        id: 1,
        name: "Action",
        rawg_genre_id: 4,
      });

      axios.get.mockResolvedValue({
        data: { results: [{ id: 1, name: "Game" }] },
      });

      const mockGenerateContent = jest
        .fn()
        .mockRejectedValue(new Error("Gemini API failed"));

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const res = await request(app).post("/games/recommendations/1").send({});

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toContain("Gemini API error");
    });
  });

  describe("POST /user/favourites", () => {
    test("should add favourite with existing game_id", async () => {
      User.findByPk.mockResolvedValue({ id: 1, email: "test@test.com" });
      Game.findByPk.mockResolvedValue({
        id: 10,
        rawg_id: 100,
        name: "Test Game",
        imageUrl: "image.jpg",
        released: "2023-01-01",
      });

      UserFavourite.create.mockResolvedValue({
        id: 1,
        user_id: 1,
        game_id: 10,
      });

      const res = await request(app)
        .post("/user/favourites")
        .send({ user_id: 1, game_id: 10 });

      expect(res.statusCode).toBe(201);
      expect(res.body.user_id).toBe(1);
      expect(res.body.game_id).toBe(10);
      expect(res.body.game.name).toBe("Test Game");
    });

    test("should add favourite with rawg_id (fetch from RAWG)", async () => {
      User.findByPk.mockResolvedValue({ id: 1, email: "test@test.com" });

      axios.get.mockResolvedValue({
        data: {
          id: 3328,
          name: "The Witcher 3",
          background_image: "witcher.jpg",
          released: "2015-05-19",
        },
      });

      Game.findOne.mockResolvedValue(null); // Not in DB yet
      Game.create.mockResolvedValue({
        id: 20,
        rawg_id: 3328,
        name: "The Witcher 3",
        imageUrl: "witcher.jpg",
        released: "2015-05-19",
      });

      UserFavourite.create.mockResolvedValue({
        id: 2,
        user_id: 1,
        game_id: 20,
      });

      const res = await request(app)
        .post("/user/favourites")
        .send({ user_id: 1, rawg_id: 3328 });

      expect(res.statusCode).toBe(201);
      expect(res.body.game.rawg_id).toBe(3328);
      expect(res.body.game.name).toBe("The Witcher 3");
      expect(axios.get).toHaveBeenCalledWith(
        "https://api.rawg.io/api/games/3328",
        expect.any(Object)
      );
    });

    test("should return 400 if user_id missing", async () => {
      const res = await request(app)
        .post("/user/favourites")
        .send({ game_id: 10 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("user_id");
    });

    test("should return 400 if both game_id and rawg_id missing", async () => {
      const res = await request(app)
        .post("/user/favourites")
        .send({ user_id: 1 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("game_id or rawg_id");
    });

    test("should return 404 if user not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post("/user/favourites")
        .send({ user_id: 999, game_id: 10 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain("User not found");
    });

    test("should return 404 if game_id not found in database", async () => {
      User.findByPk.mockResolvedValue({ id: 1 });
      Game.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post("/user/favourites")
        .send({ user_id: 1, game_id: 999 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain("Game not found");
    });

    test("should return 404 if RAWG game not found", async () => {
      User.findByPk.mockResolvedValue({ id: 1 });
      axios.get.mockRejectedValue(new Error("Not found"));

      const res = await request(app)
        .post("/user/favourites")
        .send({ user_id: 1, rawg_id: 999999 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain("RAWG game");
    });

    test("should update existing game if found by rawg_id", async () => {
      User.findByPk.mockResolvedValue({ id: 1 });

      axios.get.mockResolvedValue({
        data: {
          id: 3328,
          name: "The Witcher 3",
          background_image: "new-image.jpg",
          released: "2015-05-19",
        },
      });

      const mockGame = {
        id: 15,
        rawg_id: 3328,
        name: "The Witcher 3",
        imageUrl: null,
        update: jest.fn().mockResolvedValue(true),
      };

      Game.findOne.mockResolvedValue(mockGame);

      UserFavourite.create.mockResolvedValue({
        id: 3,
        user_id: 1,
        game_id: 15,
      });

      const res = await request(app)
        .post("/user/favourites")
        .send({ user_id: 1, rawg_id: 3328 });

      expect(res.statusCode).toBe(201);
      expect(mockGame.update).toHaveBeenCalledWith({
        imageUrl: "new-image.jpg",
      });
    });
  });

  describe("GET /user/favourites", () => {
    test("should list user favourites", async () => {
      UserFavourite.findAll.mockResolvedValue([
        {
          id: 1,
          user_id: 1,
          game_id: 10,
          game: {
            id: 10,
            name: "Game 1",
            imageUrl: "img1.jpg",
            released: "2023-01-01",
            rating: 4.5,
          },
        },
      ]);

      const res = await request(app).get("/user/favourites?user_id=1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].game.name).toBe("Game 1");
    });

    test("should return 400 if user_id missing", async () => {
      const res = await request(app).get("/user/favourites");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("user id required");
    });

    test("should handle imageUrl fallbacks", async () => {
      UserFavourite.findAll.mockResolvedValue([
        {
          id: 1,
          user_id: 1,
          game_id: 10,
          game: {
            id: 10,
            name: "Game 1",
            imageUrl: null,
            background_image: "fallback.jpg",
          },
        },
      ]);

      const res = await request(app).get("/user/favourites?user_id=1");

      expect(res.statusCode).toBe(200);
      expect(res.body[0].game.imageUrl).toBe("fallback.jpg");
    });
  });

  describe("DELETE /user/favourites/:gameId", () => {
    test("should delete favourite", async () => {
      const mockFav = {
        id: 1,
        user_id: 1,
        game_id: 10,
        destroy: jest.fn().mockResolvedValue(true),
      };

      UserFavourite.findOne.mockResolvedValue(mockFav);

      const res = await request(app)
        .delete("/user/favourites/10")
        .query({ user_id: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.game_id).toBe(10);
      expect(mockFav.destroy).toHaveBeenCalled();
    });

    test("should return 400 if user_id missing", async () => {
      const res = await request(app).delete("/user/favourites/10");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("user_id required");
    });

    test("should return 404 if favourite not found", async () => {
      UserFavourite.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete("/user/favourites/999")
        .query({ user_id: 1 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain("Favourite not found");
    });
  });
});
