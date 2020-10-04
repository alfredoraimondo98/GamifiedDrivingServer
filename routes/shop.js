const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');
 

router.post('/buyWithTickets', shopController.buyWithTickets);
router.post('/buyWithPoints', shopController.buyWithPoints);

module.exports = router;