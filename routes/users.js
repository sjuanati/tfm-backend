let express = require('express');
let router = express.Router();
let userScripts = require('../controllers/userScript');
let md_auth = require('../controllers/authenticated');
const db = require('../controllers/queries');

router.get('/findAll', md_auth.ensureAuth, userScripts.findAll);

router.get('/pharmacy/get', md_auth.ensureAuth, db.getUserPharmacy);
router.post('/pharmacy/set', md_auth.ensureAuth, db.setUserPharmacy);

router.get('/address/get', md_auth.ensureAuth, db.getUserAddress);
router.post('/address/set', md_auth.ensureAuth, db.setUserAddress);

router.get('/profile/get', md_auth.ensureAuth, db.getUserProfile);
router.post('/profile/set', md_auth.ensureAuth, db.setUserProfile);
router.get('/check/email', md_auth.ensureAuth, db.checkUserEmail);

router.post('/login', userScripts.login);
router.post('/register', userScripts.register);
router.post('/findOneById', md_auth.ensureAuth, userScripts.findOneById);

module.exports = router;
