const { generateToken, verifyToken } = require("../helpers/jwt");

describe("jwt helper", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key";
  });

  test("generateToken should create a valid JWT token", () => {
    const payload = { id: 1, email: "test@example.com" };
    const token = generateToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts
  });

  test("verifyToken should decode a valid token", () => {
    const payload = { id: 1, email: "test@example.com" };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });

  test("verifyToken should return null for invalid token", () => {
    const invalidToken = "invalid.token.here";
    const result = verifyToken(invalidToken);
    expect(result).toBeNull();
  });

  test("verifyToken should return null for tampered token", () => {
    const payload = { id: 1, email: "test@example.com" };
    const token = generateToken(payload);
    const tamperedToken = token.slice(0, -5) + "xxxxx";
    const result = verifyToken(tamperedToken);
    expect(result).toBeNull();
  });

  test("generateToken should include additional claims", () => {
    const payload = { id: 1, email: "test@example.com", role: "Admin" };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.role).toBe("Admin");
  });

  test("decoded token should have iat (issued at) and exp claims", () => {
    const payload = { id: 1 };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
    expect(typeof decoded.iat).toBe("number");
    expect(typeof decoded.exp).toBe("number");
  });

  test("token should expire after 1 hour", () => {
    const payload = { id: 1 };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(3600); // 1 hour in seconds
  });
});
