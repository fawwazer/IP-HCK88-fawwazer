"use strict";

const express = require("express");
const router = express.Router();

// All API endpoints have been removed per user request. Return 410 Gone for clarity.
router.use((req, res) => res.status(410).json({ error: "API removed" }));

module.exports = router;
