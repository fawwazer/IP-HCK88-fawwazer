"use strict";
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const auth = require("./middleware/auth");

const errorHandler = require("./middleware/error-handler");
const gameController = require("./controllers/gameController");
const userController = require("./controllers/userController");
const guardUser = require("./middleware/guardAdmin");
const app = express();

if (process.env.NODE_ENV !== "production") app.use(require("morgan")("dev"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// basic hello world route
app.get("/", (req, res) => res.send("hello world"));
app.post("/register", userController.register);
app.post("/login", userController.login);
app.post("/google-login", userController.goggleLogin);
// app.use(auth);
app.get("/games", gameController.getAllGames);
app.get("/genres", gameController.listGenres);
app.get("/genres/:genreId/games", gameController.selectGameBasedOnGenre);
// app.post("/games/recommendations", gameController.getGameRecommendations);
app.post(
  "/games/recommendations/:genreId",
  gameController.getGameRecommendations
);
app.use(auth);
app.post("/user/favourites", guardUser, gameController.addUserFavourite);
app.get("/user/favourites", guardUser, gameController.listUserFavourites);
app.delete(
  "/user/favourites/:gameId",
  guardUser,
  gameController.removeUserFavourite
);

// Error handler
app.use(errorHandler);

module.exports = app;
