"use strict";

const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/', gameController.list);
router.get('/:id', gameController.get);

module.exports = router;
