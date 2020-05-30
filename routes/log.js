const express = require('express');
const router = express.Router();

const md_auth = require('../controllers/authenticated');
const log = require('../controllers/logRecorder');

router.post('/save', log.saveFront);

module.exports = router;