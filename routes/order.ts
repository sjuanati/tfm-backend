import * as express from 'express';
const router = express.Router();
const md_auth = require('../controllers/authenticated');
const orderScripts = require('../controllers/orderScripts');
const db = require('../controllers/queries');

router.get('/get/user', md_auth.ensureAuth, db.getOrderUser);
router.get('/get/item/user', md_auth.ensureAuth, db.getOrderItemUser);
router.get('/get/pharmacy', md_auth.ensureAuth, db.getOrderPharmacy);
router.get('/get/item/pharmacy', md_auth.ensureAuth, db.getOrderItemPharmacy);
router.post('/add', md_auth.ensureAuth,  db.addOrder);
router.post('/add', db.addOrder);
router.post('/getOrders', md_auth.ensureAuth, orderScripts.getOrders);
router.post('/changeOrderStatus', md_auth.ensureAuth, orderScripts.changeOrderStatus);

module.exports = router;
