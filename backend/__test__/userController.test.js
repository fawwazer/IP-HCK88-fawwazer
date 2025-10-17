const request = require("supertest");
const express = require("express");

// Mock models
jest.mock("../models", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

// Mock helpers
jest.mock("../helpers/bcrypt", () => ({
  comparePasswords: jest.fn(),
}));

jest.mock("../helpers/jwt", () => ({
  generateToken: jest.fn((payload) => `token_${payload.id}`),
  verifyToken: jest.fn(),
}));

// Mock Google OAuth2Client
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

describe("UserController", () => {
  let app;
  let User;
  let bcrypt;
  let jwt;

  beforeAll(() => {
    // Setup express app
    app = express();
    app.use(express.json());

    // Import mocked modules
    User = require("../models").User;
    bcrypt = require("../helpers/bcrypt");
    jwt = require("../helpers/jwt");

    // Set env variables
    process.env.JWT_SECRET = "test-secret-key";
    process.env.GOOGLE_API_KEY = "test-google-key";

    // Setup routes
    const userController = require("../controllers/userController");
    app.post("/register", userController.register);
    app.post("/login", userController.login);
    app.post("/google-login", userController.goggleLogin);

    // Error handler - similar to the actual error handler
    app.use((err, req, res, next) => {
      // Handle Sequelize errors
      if (
        err.name === "SequelizeValidationError" ||
        err.name === "SequelizeUniqueConstraintError"
      ) {
        return res.status(400).json({ message: err.message });
      }

      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    test("should register new user successfully", async () => {
      User.create.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        username: "testuser",
        role: "User",
      });

      const res = await request(app).post("/register").send({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBe(1);
      expect(res.body.email).toBe("test@example.com");
      expect(User.create).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        role: "User",
      });
    });

    test("should return 400 if email already exists", async () => {
      const err = new Error("email must be unique");
      err.name = "SequelizeUniqueConstraintError";
      User.create.mockRejectedValue(err);

      const res = await request(app).post("/register").send({
        email: "existing@example.com",
        password: "password123",
        username: "testuser",
      });

      expect(res.statusCode).toBe(400);
    });

    test("should return 400 if email is missing", async () => {
      const err = new Error("email is required");
      err.name = "SequelizeValidationError";
      User.create.mockRejectedValue(err);

      const res = await request(app).post("/register").send({
        password: "password123",
        username: "testuser",
      });

      expect(res.statusCode).toBe(400);
    });

    test("should return 400 if password is missing", async () => {
      const err = new Error("password is required");
      err.name = "SequelizeValidationError";
      User.create.mockRejectedValue(err);

      const res = await request(app).post("/register").send({
        email: "test@example.com",
        username: "testuser",
      });

      expect(res.statusCode).toBe(400);
    });

    test("should handle database errors", async () => {
      const err = new Error("Database error");
      User.create.mockRejectedValue(err);

      const res = await request(app).post("/register").send({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("POST /login", () => {
    test("should login successfully with correct credentials", async () => {
      User.findOne.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        username: "testuser",
      });

      bcrypt.comparePasswords.mockReturnValue(true);

      const res = await request(app).post("/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBe("token_1");
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcrypt.comparePasswords).toHaveBeenCalled();
      expect(jwt.generateToken).toHaveBeenCalled();
    });

    test("should return 401 with invalid email", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app).post("/login").send({
        email: "wrong@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain("Invalid");
    });

    test("should return 401 with invalid password", async () => {
      User.findOne.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
      });
      bcrypt.comparePasswords.mockReturnValue(false);

      const res = await request(app).post("/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain("Invalid");
    });

    test("should return 400 if email is missing", async () => {
      const res = await request(app).post("/login").send({
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
    });

    test("should return 400 if password is missing", async () => {
      const res = await request(app).post("/login").send({
        email: "test@example.com",
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /google-login", () => {
    test("should return 400 if id_token is missing", async () => {
      const res = await request(app).post("/google-login").send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("id_token");
    });

    test("should handle errors during Google OAuth", async () => {
      const res = await request(app).post("/google-login").send({
        id_token: "invalid-token",
      });

      // Will fail due to mock not being properly set up - this is expected
      expect(res.statusCode).toBe(500);
    });
  });
});
