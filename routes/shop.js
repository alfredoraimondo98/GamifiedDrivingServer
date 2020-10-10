const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');
 

router.post('/buyWithTickets', shopController.buyWithTickets);
router.post('/buyWithPoints', shopController.buyWithPoints); //Attualmente questo endpoint e metodo non servono!!
router.post('/getShopAuto', shopController.getShopAuto);
router.post('/buyAuto', shopController.buyAuto);
module.exports = router;