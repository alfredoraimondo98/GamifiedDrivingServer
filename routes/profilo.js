const express = require('express');
const router = express.Router();

const profiloController = require('../controllers/profilo');
const isAuth = require('../middleware/is-auth');

router.post('/getProfilo', profiloController.getProfilo);

router.post('/garage/getGarage', profiloController.getGarage);

router.get('/classifica/getClassificaGenerale', profiloController.getClassificaGenerale);
router.post('/classifica/getClassificaByLocation', profiloController.getClassificaLocation);
router.post('/classifica/getAmici', profiloController.getAmici);
module.exports = router;