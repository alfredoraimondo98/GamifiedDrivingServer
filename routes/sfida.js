const express = require('express')
const router = express.Router()

 
const sfidaController = require('../controllers/sfida');

 
router.post('/getSfida', sfidaController.getSfida);

router.post('/partecipaSfida', sfidaController.partecipaSfida);

router.post('/riscattoSfida', sfidaController.riscattoSfida);

router.post('/getAllSfide', sfidaController.getAllSfide);
module.exports = router;