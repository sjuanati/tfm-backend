const express = require('express');
const router = express.Router();
const md_auth = require('../controllers/authenticated');
const db = require('../controllers/queries');

router.get('/get', md_auth.ensureAuth, db.getProduct);

module.exports = router;