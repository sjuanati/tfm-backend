import * as express from 'express';
const router = express.Router();
const logger = require('../shared/logRecorder');

router.post('/save', logger.saveFront);

module.exports = router;
