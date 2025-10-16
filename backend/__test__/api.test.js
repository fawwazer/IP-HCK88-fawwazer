const request = require("supertest");
const axios = require("axios");

jest.mock("axios");

// Mock the models module used by controllers
jest.mock("../models", () => {
  const mockGenre = { id: 1, name: "Action", rawg_genre_id: "action" };
  const mockGameRecord = {
    id: 42,
    rawg_id: 3498,
    name: "Mock Game",
    imageUrl: "https://example.com/img.jpg",
    released: "2015-05-18",
  };

  return {
    Genre: {
      findAll: jest.fn(() => Promise.resolve([mockGenre])),
      findByPk: jest.fn((id) => Promise.resolve(mockGenre)),
    },
    User: {
      findByPk: jest.fn((id) => Promise.resolve({ id })),
    },
    Game: {
      findByPk: jest.fn((id) => Promise.resolve(mockGameRecord)),
      findOne: jest.fn(() => Promise.resolve(null)),
      create: jest.fn((obj) =>
        Promise.resolve(Object.assign({ id: mockGameRecord.id }, obj))
      ),
      update: jest.fn(() => Promise.resolve()),
    },
    UserFavourite: {
      create: jest.fn((obj) => Promise.resolve(Object.assign({ id: 7 }, obj))),
      findAll: jest.fn(() =>
        Promise.resolve([
          {
            id: 7,
            user_id: 1,
            game_id: mockGameRecord.id,
            game: {
              id: mockGameRecord.id,
              name: mockGameRecord.name,
              released: mockGameRecord.released,
              background_image: mockGameRecord.imageUrl,
              rating: 4.5,
            },
          },
        ])
      ),
      findOne: jest.fn(() =>
        Promise.resolve({
          id: 7,
          user_id: 1,
          game_id: mockGameRecord.id,
          destroy: jest.fn(() => Promise.resolve()),
        })
      ),
    },
  };
});

const app = require("../app");
// require the mocked models module so tests can inspect mock calls
const modelsMock = require("../models");

// Mock auth and guard middleware so app routes that use them will work in tests
jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    // attach a fake authenticated user
    req.user = { id: 1, role: "User" };
    next();
  };
});
jest.mock("../middleware/guardAdmin", () => {
  return (req, res, next) => next();
});

describe("API endpoints (mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default RAWG API key for endpoints that need it
    process.env.RAWG_API_KEY = "test-rawg-key";
    delete process.env.GEMINI_API_KEY;
    // Default axios behavior: return a small list for generic /games calls
    axios.get.mockImplementation((url, opts) => {
      // RAWG detail endpoint pattern: /api/games/:id
      if (typeof url === "string" && /\/api\/games\/[0-9]+/.test(url)) {
        return Promise.resolve({
          data: {
            id: 3498,
            name: "Mock Game",
            background_image: "https://img",
            released: "2015-05-18",
          },
        });
      }
      // default list response
      return Promise.resolve({
        data: { count: 1, results: [{ id: 1, name: "G1" }] },
      });
    });
  });

  test("GET /genres returns genres", async () => {
    const res = await request(app).get("/genres");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Action");
  });

  test("GET /games proxies RAWG and returns data", async () => {
    const sample = { count: 1, results: [{ id: 1, name: "G1" }] };
    axios.get.mockResolvedValueOnce({ data: sample });
    const res = await request(app).get("/games");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(sample);
    expect(axios.get).toHaveBeenCalled();
  });

  test("GET /genres/:genreId/games returns RAWG genre list", async () => {
    const sample = { count: 1, results: [{ id: 2, name: "G2" }] };
    axios.get.mockResolvedValueOnce({ data: sample });
    const res = await request(app).get("/genres/1/games");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(sample);
    expect(modelsMock.Genre.findByPk).toHaveBeenCalledWith("1");
  });

  test("POST /games/recommendations/:genreId returns RAWG fallback when GEMINI not set", async () => {
    const sample = { count: 1, results: [{ id: 3, name: "G3" }] };
    axios.get.mockResolvedValueOnce({ data: sample });
    const res = await request(app).post("/games/recommendations/1").send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.note).toBeDefined();
    expect(res.body.data).toEqual(sample);
  });

  test("POST /user/favourites with rawg_id creates Game and Favourite", async () => {
    // Mock RAWG detail endpoint for the rawg_id flow
    const rawgDetail = {
      id: 3498,
      name: "Mock Game",
      background_image: "https://img",
      released: "2015-05-18",
    };
    axios.get.mockResolvedValueOnce({ data: rawgDetail });

    const res = await request(app)
      .post("/user/favourites")
      .send({ user_id: 1, rawg_id: 3498 });
    expect(res.statusCode).toBe(201);
    expect(res.body.user_id).toBe(1);
    expect(res.body.game).toBeDefined();
    expect(modelsMock.User.findByPk).toHaveBeenCalledWith(1);
    expect(axios.get).toHaveBeenCalled();
    expect(modelsMock.UserFavourite.create).toHaveBeenCalled();
  });

  test("GET /user/favourites?user_id=1 returns favourites list", async () => {
    const res = await request(app).get("/user/favourites?user_id=1");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].game.name).toBe("Mock Game");
  });

  test("DELETE /user/favourites/:gameId deletes the favourite", async () => {
    const res = await request(app)
      .delete(`/user/favourites/42`)
      .send({ user_id: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(7);
    expect(modelsMock.UserFavourite.findOne).toHaveBeenCalled();
  });
});
