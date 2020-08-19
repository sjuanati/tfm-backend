import * as express from 'express';
let router = express.Router();
let pharmacyScripts = require('../controllers/pharmacyScript');
let md_auth = require('../controllers/authenticated');
const db = require('../controllers/queries');

router.get('/get', md_auth.ensureAuth, db.getPharmacy);
router.get('/schedule/get', md_auth.ensureAuth, db.getPharmacySchedule);
router.get('/findAll', md_auth.ensureAuth, pharmacyScripts.findAll);
router.get('/profile/get', md_auth.ensureAuth, db.getPharmacyProfile);
router.post('/profile/set', md_auth.ensureAuth, db.setPharmacyProfile);
router.get('/check/email', md_auth.ensureAuth, db.checkPharmacyEmail);
router.get('/orders/get', md_auth.ensureAuth, db.getPharmacyOrders);
router.post('/login', pharmacyScripts.login);
router.post('/register', pharmacyScripts.register);
router.post('/findOneById', md_auth.ensureAuth, pharmacyScripts.findOneById);

module.exports = router;
