let express = require('express');
let router = express.Router();

let md_auth = require('../controllers/authenticated');

let imageScript = require('../controllers/imagesScript');

router.get('/:name', imageScript.getImageById);

module.exports = router;
