const request = require("supertest");
const express = require("express");

// We'll import the real error handler
const errorHandler = require("../middleware/error-handler");

describe("error-handler middleware", () => {
  let app;

  beforeAll(() => {
    app = express();
    // routes that throw errors with different names
    app.get("/val", () => {
      const e = new Error("bad");
      e.name = "SequelizeValidationError";
      throw e;
    });

    app.get("/unique", () => {
      const e = new Error("unique");
      e.name = "SequelizeUniqueConstraintError";
      throw e;
    });

    app.get("/bad", () => {
      const e = new Error("missing");
      e.name = "BadRequest";
      throw e;
    });

    app.get("/unauth", () => {
      const e = new Error("no token");
      e.name = "Unauthorized";
      throw e;
    });

    app.get("/jwt", () => {
      const e = new Error("jwt bad");
      e.name = "JsonWebTokenError";
      throw e;
    });

    app.get("/forbid", () => {
      const e = new Error("forbidden");
      e.name = "forbidden";
      throw e;
    });

    app.get("/notfound", () => {
      const e = new Error("notfound");
      e.name = "NotFound";
      throw e;
    });

    app.get("/other", () => {
      throw new Error("boom");
    });

    app.use(errorHandler);
  });

  test("SequelizeValidationError -> 400", async () => {
    const res = await request(app).get("/val");
    expect(res.statusCode).toBe(400);
  });

  test("SequelizeUniqueConstraintError -> 400", async () => {
    const res = await request(app).get("/unique");
    expect(res.statusCode).toBe(400);
  });

  test("BadRequest -> 400", async () => {
    const res = await request(app).get("/bad");
    expect(res.statusCode).toBe(400);
  });

  test("Unauthorized -> 401", async () => {
    const res = await request(app).get("/unauth");
    expect(res.statusCode).toBe(401);
  });

  test("JsonWebTokenError -> 401", async () => {
    const res = await request(app).get("/jwt");
    expect(res.statusCode).toBe(401);
  });

  test("forbidden -> 403", async () => {
    const res = await request(app).get("/forbid");
    expect(res.statusCode).toBe(403);
  });

  test("NotFound -> 404", async () => {
    const res = await request(app).get("/notfound");
    expect(res.statusCode).toBe(404);
  });

  test("generic error -> 500", async () => {
    const res = await request(app).get("/other");
    expect(res.statusCode).toBe(500);
  });
});
