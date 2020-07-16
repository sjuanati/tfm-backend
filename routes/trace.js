let express = require('express');
let router = express.Router();
let ethOrderTrace = require('../controllers/ethOrderTrace');
let md_auth = require('../controllers/authenticated');

router.get('/order', md_auth.ensureAuth, ethOrderTrace.getOrderTraceDB);
router.get('/order/global', md_auth.ensureAuth, ethOrderTrace.checkGlobalOrderTrace);

module.exports = router;
