"use strict";
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
// Placeholder Express app entry. You'll add routes and middleware here.
// Created as a placeholder per request.

const express = require("express");
const app = express();

app.use(express.json());

module.exports = app;
