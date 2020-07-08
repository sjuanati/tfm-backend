let express = require('express');
let router = express.Router();

let md_auth = require('../controllers/authenticated');
let orderScripts = require('../controllers/orderScripts');
const db = require('../controllers/queries');

router.get('/get/user', md_auth.ensureAuth, db.getOrderUser);
router.get('/get/item/user', md_auth.ensureAuth, db.getOrderItemUser);
router.get('/get/pharmacy', md_auth.ensureAuth, db.getOrderPharmacy);
router.get('/get/item/pharmacy', md_auth.ensureAuth, db.getOrderItemPharmacy);
router.get('/getLinePhoto', db.getOrderLinePhoto);

router.post('/add', md_auth.ensureAuth,  db.addOrder);
router.post('/add', db.addOrder);
router.post('/toS3', db.movePhotosToS3);

router.post('/getOrders', md_auth.ensureAuth, orderScripts.getOrders);
//router.post('/cancelOrder', md_auth.ensureAuth, orderScripts.cancelOrder);
//router.post('/cancelOrderUser', md_auth.ensureAuth, orderScripts.cancelOrderUser);
//router.post('/deliverOrder', md_auth.ensureAuth, orderScripts.deliverOrder);
//router.post('/informPriceOrder', md_auth.ensureAuth, orderScripts.informPriceOrder);
//router.post('/confirmOrder', md_auth.ensureAuth, orderScripts.confirmOrder);
//router.post('/acceptPriceOrder', md_auth.ensureAuth, orderScripts.acceptPriceOrder);
//router.post('/deliverOrder', md_auth.ensureAuth, orderScripts.deliverOrder);
//router.post('/onTheWayOrder', md_auth.ensureAuth, orderScripts.onTheWayOrder);
//router.post('/readyOrder', md_auth.ensureAuth, orderScripts.readyOrder);
router.post('/changeOrderStatus', md_auth.ensureAuth, orderScripts.changeOrderStatus);

module.exports = router;
