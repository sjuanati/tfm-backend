let express = require('express');
let router = express.Router();
let traceScript = require('../controllers/traceScript');
let md_auth = require('../controllers/authenticated');

router.get('/order', md_auth.ensureAuth, traceScript.getOrderTraceDB);

module.exports = router;
