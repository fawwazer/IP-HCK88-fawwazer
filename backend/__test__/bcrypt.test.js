const { hashPassword, comparePasswords } = require("../helpers/bcrypt");

describe("bcrypt helper", () => {
  test("hashPassword should hash a password", async () => {
    const password = "testpassword123";
    const hashed = await hashPassword(password);
    expect(hashed).toBeDefined();
    expect(typeof hashed).toBe("string");
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(0);
  });

  test("comparePasswords should return true for correct password", async () => {
    const password = "testpassword123";
    const hashed = await hashPassword(password);
    const result = await comparePasswords(password, hashed);
    expect(result).toBe(true);
  });

  test("comparePasswords should return false for incorrect password", async () => {
    const password = "testpassword123";
    const wrongPassword = "wrongpassword";
    const hashed = await hashPassword(password);
    const result = await comparePasswords(wrongPassword, hashed);
    expect(result).toBe(false);
  });

  test("hashPassword should generate different hashes for same password", async () => {
    const password = "testpassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    // Different salts mean different hashes
    expect(hash1).not.toBe(hash2);
    // But both should verify correctly
    expect(await comparePasswords(password, hash1)).toBe(true);
    expect(await comparePasswords(password, hash2)).toBe(true);
  });
});
