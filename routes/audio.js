let express = require('express');
let router = express.Router();

let md_auth = require('../controllers/authenticated');

let audioScript = require('../controllers/audioScript');

router.get('/:name', audioScript.getAudioById);

module.exports = router;
