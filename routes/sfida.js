const express = require('express')
const router = express.Router()

 
const sfidaController = require('../controllers/sfida');

router.post('/generateSfide', sfidaController.generateSfide);

router.post('/getSfida', sfidaController.getSfida);

module.exports = router;