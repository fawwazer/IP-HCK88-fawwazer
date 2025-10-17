const request = require("supertest");
const express = require("express");
const guardUser = require("../middleware/guardAdmin"); // Actually guardUser
const { UserFavourite } = require("../models");

// Mock UserFavourite model
jest.mock("../models", () => ({
  UserFavourite: {
    findOne: jest.fn(),
  },
}));

describe("guardUser middleware", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware that sets req.user
    app.use((req, res, next) => {
      const role = req.headers["x-test-role"];
      const userId = req.headers["x-test-user-id"];
      if (role || userId) {
        req.user = {
          id: parseInt(userId) || 1,
          role: role || "User",
        };
      }
      next();
    });

    // Test routes
    app.get("/user/favourites", guardUser, (req, res) => {
      res.status(200).json({ message: "Access granted" });
    });

    app.delete("/user/favourites/:gameId", guardUser, (req, res) => {
      res.status(200).json({ message: "Deleted" });
    });

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should allow Admin role", async () => {
    const res = await request(app)
      .get("/user/favourites?user_id=1")
      .set("x-test-role", "Admin")
      .set("x-test-user-id", "1");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Access granted");
  });

  test("should allow User accessing their own data", async () => {
    const res = await request(app)
      .get("/user/favourites?user_id=1")
      .set("x-test-role", "User")
      .set("x-test-user-id", "1");

    expect(res.statusCode).toBe(200);
  });

  test("should reject User accessing other user data", async () => {
    const res = await request(app)
      .get("/user/favourites?user_id=2")
      .set("x-test-role", "User")
      .set("x-test-user-id", "1");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });

  test("should allow User deleting their own favourite", async () => {
    UserFavourite.findOne.mockResolvedValue({
      id: 1,
      user_id: 1,
      game_id: 42,
    });

    const res = await request(app)
      .delete("/user/favourites/42")
      .set("x-test-role", "User")
      .set("x-test-user-id", "1");

    expect(res.statusCode).toBe(200);
  });

  test("should allow User with default target if gameId provided", async () => {
    // When gameId param not found, falls back to req.user.id check
    UserFavourite.findOne.mockResolvedValue(null);

    const res = await request(app)
      .delete("/user/favourites/999")
      .set("x-test-role", "User")
      .set("x-test-user-id", "1");

    // Falls back to targetUserId === user.id check (1 === 1) so it passes
    expect(res.statusCode).toBe(200);
  });

  test("should reject when user is not authenticated", async () => {
    const res = await request(app).get("/user/favourites?user_id=1");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
});
