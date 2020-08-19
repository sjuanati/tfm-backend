import * as express from 'express';
const router = express.Router();
const md_auth = require('../controllers/authenticated');
const db = require('../controllers/queries');

router.get('/get', md_auth.ensureAuth, db.getProduct);
router.get('/get/last5', md_auth.ensureAuth, db.getProductLast5);

module.exports = router;
