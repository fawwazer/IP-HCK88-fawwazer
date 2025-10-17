const request = require("supertest");
const express = require("express");
const auth = require("../middleware/auth");
const { generateToken } = require("../helpers/jwt");
const { User } = require("../models");

// Mock User model
jest.mock("../models", () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

describe("auth middleware", () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key";
    app = express();
    app.use(express.json());

    // Protected route
    app.get("/protected", auth, (req, res) => {
      res.status(200).json({ user: req.user });
    });

    // Error handler
    app.use((err, req, res, next) => {
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: err.message });
      }
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should allow access with valid token", async () => {
    // Mock user in database
    User.findByPk.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      role: "User",
    });

    const token = generateToken({ id: 1, email: "test@example.com" });
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.email).toBe("test@example.com");
  });

  test("should reject request without token", async () => {
    const res = await request(app).get("/protected");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  test("should reject request with invalid token format", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "InvalidToken");

    expect(res.statusCode).toBe(401);
  });

  test("should reject request with malformed Bearer token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer");

    expect(res.statusCode).toBe(401);
  });

  test("should reject request with invalid JWT", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.statusCode).toBe(401);
  });

  test("should reject request with tampered token", async () => {
    const token = generateToken({ id: 1, email: "test@example.com" });
    const tamperedToken = token.slice(0, -5) + "xxxxx";
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${tamperedToken}`);

    expect(res.statusCode).toBe(401);
  });

  test("should work with lowercase 'bearer'", async () => {
    User.findByPk.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      role: "User",
    });

    const token = generateToken({ id: 1, email: "test@example.com" });
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  test("should reject expired token", async () => {
    // Create a token with past expiration
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { id: 1, email: "test@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "-1h" }
    );

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
  });

  test("should reject token for non-existent user", async () => {
    User.findByPk.mockResolvedValue(null); // User not found

    const token = generateToken({ id: 999, email: "nonexistent@example.com" });
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
  });
});
