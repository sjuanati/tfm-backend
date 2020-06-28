const express = require('express');
const router = express.Router();

const md_auth = require('../controllers/authenticated');
const logger = require('../shared/logRecorder');

router.post('/save', logger.saveFront);

module.exports = router;