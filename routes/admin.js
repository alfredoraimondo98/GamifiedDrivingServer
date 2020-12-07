const express = require('express')
const router = express.Router()

 
const adminController = require('../controllers/admin');

router.post('/generaSfide', adminController.generaSfide);
router.post('/updateCostanteCrescita', adminController.updateCostanteCrescita);
router.post('/updateStatisticheGamification', adminController.updateStatisticheGamification);
router.post('/updateStoricoDrivepass', adminController.updateStoricoDrivepass);
router.post('/updateMyPortafoglio', adminController.updateMyPortafoglio);



module.exports = router;