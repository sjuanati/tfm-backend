let express = require('express');
let router = express.Router();
let ethPCToken = require('../controllers/ethPCToken');
let md_auth = require('../controllers/authenticated');

router.get('/get/balance', md_auth.ensureAuth, ethPCToken.checkBalance);
//router.get('/earnTokensOnPurchase', md_auth.ensureAuth, ethPCToken.earnTokensOnPurchase);

module.exports = router;

