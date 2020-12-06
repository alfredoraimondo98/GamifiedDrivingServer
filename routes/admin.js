const express = require('express')
const router = express.Router()

 
const adminController = require('../controllers/admin');

router.post('/updateCostanteCrescita', adminController.updateCostanteCrescita);


module.exports = router;