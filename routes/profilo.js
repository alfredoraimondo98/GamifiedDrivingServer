const express = require('express');
const router = express.Router();

const profiloController = require('../controllers/profilo');
const isAuth = require('../middleware/is-auth');

router.post('/getProfilo', profiloController.getProfilo);

router.post('/garage/getGarage', profiloController.getGarage);


module.exports = router;